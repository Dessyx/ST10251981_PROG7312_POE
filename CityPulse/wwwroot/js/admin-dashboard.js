document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.sidebar-nav-link');
    const contentSections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
    
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            contentSections.forEach(section => section.classList.remove('active'));
               
            const targetId = this.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });


    loadDashboardRequests();
    
    // Status filter
    const dashStatusFilter = document.getElementById('dashStatusFilter');
    if (dashStatusFilter) {
        dashStatusFilter.addEventListener('change', loadDashboardRequests);
    }

  
    setInterval(() => {
        loadDashboardRequests();
    }, 30000);
    
    initializeAnalyticsCharts();
});

async function loadDashboardRequests() {
    try {
        const response = await fetch('/Admin/GetAllServiceRequests');
        const data = await response.json();
        
        if (data.error) {
            console.error('Unauthorized access');
            return;
        }

        updateDashboardStatistics(data.statistics || {});
        renderDashboardTable(data.reports || []);
        
    } catch (error) {
        console.error('Error loading service requests:', error);
    }
}

function updateDashboardStatistics(stats) {
    const pending = stats.Pending || 0;
    const inProgress = stats.InProgress || 0;
    const resolved = stats.Resolved || 0;
    const rejected = stats.Rejected || 0;

    const pendingEl = document.getElementById('dashPendingCount');
    const progressEl = document.getElementById('dashProgressCount');
    const resolvedEl = document.getElementById('dashResolvedCount');
    const rejectedEl = document.getElementById('dashRejectedCount');

    if (pendingEl) pendingEl.textContent = pending;
    if (progressEl) progressEl.textContent = inProgress;
    if (resolvedEl) resolvedEl.textContent = resolved;
    if (rejectedEl) rejectedEl.textContent = rejected;
}

function renderDashboardTable(reports) {
    const tbody = document.getElementById('dashRequestsBody');
    const statusFilter = document.getElementById('dashStatusFilter')?.value || 'Pending';
    
    if (!tbody) return;

  
    let filteredReports = statusFilter === 'all' 
        ? reports 
        : reports.filter(r => r.status === statusFilter);


    filteredReports.sort((a, b) => new Date(b.createdUtc) - new Date(a.createdUtc));

    if (filteredReports.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="bi bi-inbox" style="font-size: 2rem; color: #ccc;"></i>
                    <p class="mt-2 text-muted mb-0">No ${statusFilter.toLowerCase()} requests found</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredReports.map(report => {
        const statusColors = {
            'Pending': 'warning',
            'InProgress': 'info',
            'Resolved': 'success',
            'Rejected': 'danger'
        };
        
        const statusColor = statusColors[report.status] || 'secondary';
        const date = new Date(report.createdUtc).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const description = report.description.length > 60 
            ? report.description.substring(0, 60) + '...' 
            : report.description;

        return `
            <tr>
                <td><strong>${report.referenceNumber}</strong></td>
                <td><span class="badge bg-secondary">${report.category}</span></td>
                <td>${report.location}</td>
                <td>${description || 'N/A'}</td>
                <td>${date}</td>
                <td><span class="badge bg-${statusColor}">${formatStatusText(report.status)}</span></td>
                <td>
                    <button class="btn btn-sm me-1 rounded-circle" style="border: 1px solid #0dcaf0; color: #0dcaf0; width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center;" onclick="openReviewModal('${report.referenceNumber}')" title="Review Details">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${report.status === 'Pending' ? `
                        <button class="btn btn-sm btn-success" style="border-radius: 10px;" onclick="quickUpdate('${report.referenceNumber}', 'InProgress')">
                            <i class="bi bi-check-circle"></i> Verify
                        </button>
                        <button class="btn btn-sm btn-danger" style="border-radius: 10px;" onclick="quickUpdate('${report.referenceNumber}', 'Rejected')">
                            <i class="bi bi-x-circle"></i> Reject
                        </button>
                    ` : report.status === 'InProgress' ? `
                        <button class="btn btn-sm btn-success" style="border-radius: 10px;" onclick="quickUpdate('${report.referenceNumber}', 'Resolved')">
                            <i class="bi bi-check-circle-fill"></i> Complete
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function formatStatusText(status) {
    const formatted = {
        'Pending': 'Pending',
        'InProgress': 'In Progress',
        'Resolved': 'Resolved',
        'Rejected': 'Rejected'
    };
    return formatted[status] || status;
}

window.refreshDashboard = function() {
    const refreshIcon = document.getElementById('refreshIcon');
    if (refreshIcon) {
        refreshIcon.classList.add('refresh-indicator');
    }
    
    loadDashboardRequests().then(() => {
        if (refreshIcon) {
            setTimeout(() => {
                refreshIcon.classList.remove('refresh-indicator');
            }, 1000);
        }
    });
};

window.quickUpdate = async function(referenceNumber, newStatus) {
 
    if (newStatus === 'InProgress') {
        openReviewModal(referenceNumber);
        return;
    }

    const messages = {
        'Rejected': 'Reject this report? This indicates it\'s invalid or outside jurisdiction.',
        'Resolved': 'Mark this report as completely resolved?'
    };
    
    const confirmed = confirm(messages[newStatus] || 'Update status?');
    if (!confirmed) return;

    try {
        const response = await fetch('/Admin/UpdateReportStatus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                referenceNumber: referenceNumber,
                status: newStatus
            })
        });

        const result = await response.json();

        if (result.success) {
            showDashToast('Status updated!', 'success');
            setTimeout(() => {
                loadDashboardRequests();
            }, 500);
        } else {
            showDashToast(result.message || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showDashToast('Error updating status', 'error');
    }
};


let currentReviewReport = null;


window.openReviewModal = async function(referenceNumber) {
    try {
       
        const response = await fetch(`/ReportIssues/SearchByReference?refNumber=${referenceNumber}`);
        const data = await response.json();
        
        if (!data.found) {
            showDashToast('Report not found', 'error');
            return;
        }
        
        const report = data.report;
        currentReviewReport = report;
        
       
        document.getElementById('modalRefNumber').textContent = report.referenceNumber;
        document.getElementById('modalLocation').textContent = report.location;
        document.getElementById('modalCategory').textContent = report.category;
        document.getElementById('modalDate').textContent = new Date(report.createdUtc).toLocaleString();
        document.getElementById('modalUserId').textContent = report.userId || 'Anonymous';
        document.getElementById('modalDescription').textContent = report.description || 'No description provided';
        
        const statusColors = {
            'Pending': 'warning',
            'InProgress': 'info',
            'Resolved': 'success',
            'Rejected': 'danger'
        };
        const statusBadge = document.getElementById('modalStatus');
        statusBadge.textContent = formatStatusText(report.status);
        statusBadge.className = `badge bg-${statusColors[report.status] || 'secondary'}`;
        
      
        document.getElementById('solutionType').value = '';
        document.getElementById('solutionNotes').value = '';
        document.getElementById('estimatedCompletion').value = '';
        
      
        const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error loading report details:', error);
        showDashToast('Error loading report details', 'error');
    }
};


window.markAsResolved = async function() {
    if (!currentReviewReport) {
        showDashToast('No report selected', 'error');
        return;
    }
    
    const solutionType = document.getElementById('solutionType').value;
    const solutionNotes = document.getElementById('solutionNotes').value;
    
    if (!solutionType) {
        showDashToast('Please select a solution type', 'error');
        return;
    }
    
    if (!solutionNotes.trim()) {
        showDashToast('Please enter resolution notes', 'error');
        return;
    }
    
    try {
        const response = await fetch('/Admin/UpdateReportStatus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                referenceNumber: currentReviewReport.referenceNumber,
                status: 'Resolved'
            })
        });

        const result = await response.json();

        if (result.success) {
           
            const modalElement = document.getElementById('reviewModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
            
            showDashToast('Report marked as resolved!', 'success');
            
            setTimeout(() => {
                loadDashboardRequests();
            }, 500);
        } else {
            showDashToast(result.message || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showDashToast('Error updating status', 'error');
    }
};

function showDashToast(message, type = 'success') {
    const existingToast = document.querySelector('.dash-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'dash-toast';
    const iconColor = type === 'success' ? '#28a745' : '#dc3545';
    toast.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'x-circle-fill'} me-2" style="color: ${iconColor};"></i>
        ${message}
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #333;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        font-weight: 500;
        min-width: 300px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s, transform 0.3s';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


const style = document.createElement('style');
style.textContent = `
    .refresh-indicator {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

function initializeAnalyticsCharts() {
 
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: ['Sanitation', 'Roads', 'Utilities', 'Water', 'Electricity', 'Other'],
                datasets: [{
                    data: [35, 25, 15, 12, 8, 5],
                    backgroundColor: [
                        '#007bff',
                        '#28a745',
                        '#ffc107',
                        '#17a2b8',
                        '#dc3545',
                        '#6c757d'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Reports Trend Chart
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
                datasets: [{
                    label: 'Reports Submitted',
                    data: [45, 52, 48, 65, 59, 70, 68, 75, 82, 90],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Reports Resolved',
                    data: [40, 48, 45, 58, 55, 65, 63, 70, 76, 85],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

