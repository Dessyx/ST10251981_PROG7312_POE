let allReports = [];
let autoRefreshInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const autoRefreshCheckbox = document.getElementById('autoRefresh');

    loadServiceRequests();

   
    if (searchInput) {
        searchInput.addEventListener('input', filterAndRender);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', filterAndRender);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterAndRender);
    }

    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', filterAndRender);
    }

    if (autoRefreshCheckbox) {
        autoRefreshCheckbox.addEventListener('change', function() {
            if (this.checked) {
                startAutoRefresh();
            } else {
                stopAutoRefresh();
            }
        });
        
        if (autoRefreshCheckbox.checked) {
            startAutoRefresh();
        }
    }
});

function startAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    autoRefreshInterval = setInterval(() => {
        loadServiceRequests(true); 
    }, 30000); // 30 seconds
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

async function loadServiceRequests(silent = false) {
    try {
        const response = await fetch('/Admin/GetAllServiceRequests');
        const data = await response.json();
        
        if (data.error) {
            showError('Unauthorized access');
            return;
        }

        allReports = data.reports || [];
        updateStatistics(data.statistics || {});
        
        if (data.reports.length === 0) {
            document.getElementById('requestsContainer').style.display = 'none';
            document.getElementById('emptyState').style.display = 'block';
        } else {
            filterAndRender();
        }
        
    } catch (error) {
        console.error('Error loading service requests:', error);
        if (!silent) {
            showError('Failed to load service requests');
        }
    }
}

function updateStatistics(stats) {
    const pending = stats.Pending || 0;
    const inProgress = stats.InProgress || 0;
    const resolved = stats.Resolved || 0;
    const rejected = stats.Rejected || 0;
    const total = pending + inProgress + resolved + rejected;

    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('inprogressCount').textContent = inProgress;
    document.getElementById('resolvedCount').textContent = resolved;
    document.getElementById('rejectedCount').textContent = rejected;

    document.getElementById('allCount').textContent = total;
    document.getElementById('pendingTabCount').textContent = pending;
    document.getElementById('progressTabCount').textContent = inProgress;
    document.getElementById('resolvedTabCount').textContent = resolved;
}

function filterAndRender() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;

    let filteredReports = allReports.filter(report => {
        const matchesSearch = searchTerm === '' || 
            report.referenceNumber.toLowerCase().includes(searchTerm) ||
            report.location.toLowerCase().includes(searchTerm) ||
            report.description.toLowerCase().includes(searchTerm) ||
            (report.userId && report.userId.toLowerCase().includes(searchTerm));
        
        const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    filteredReports = sortReports(filteredReports, sortFilter);

    renderReports(filteredReports);
    renderTabSpecific(filteredReports);
}

function sortReports(reports, sortBy) {
    switch(sortBy) {
        case 'newest':
            return reports.sort((a, b) => new Date(b.createdUtc) - new Date(a.createdUtc));
        case 'oldest':
            return reports.sort((a, b) => new Date(a.createdUtc) - new Date(b.createdUtc));
        case 'location':
            return reports.sort((a, b) => a.location.localeCompare(b.location));
        default:
            return reports;
    }
}

function renderTabSpecific(reports) {
    const pendingReports = reports.filter(r => r.status === 'Pending');
    renderReportsInContainer(pendingReports, 'pendingContainer');

    const progressReports = reports.filter(r => r.status === 'InProgress');
    renderReportsInContainer(progressReports, 'progressContainer');

    const resolvedReports = reports.filter(r => r.status === 'Resolved');
    renderReportsInContainer(resolvedReports, 'resolvedContainer');
}

function renderReportsInContainer(reports, containerId) {
    const container = document.getElementById(containerId);
    
    if (reports.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                <p class="mt-3 text-muted">No requests in this category</p>
            </div>
        `;
        return;
    }

    container.innerHTML = reports.map(report => createReportCard(report)).join('');
}

function renderReports(reports) {
    const container = document.getElementById('requestsContainer');
    const emptyState = document.getElementById('emptyState');

    if (reports.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    container.style.display = 'block';
    emptyState.style.display = 'none';

    container.innerHTML = reports.map(report => createReportCard(report)).join('');
}

function createReportCard(report) {
    const statusColors = {
        'Pending': 'warning',
        'InProgress': 'info',
        'Resolved': 'success',
        'Rejected': 'danger'
    };

    const iconMap = {
        'Sanitation': 'trash',
        'Roads': 'cone-striped',
        'Utilities': 'tools',
        'Water': 'droplet-fill',
        'Electricity': 'lightning-charge-fill',
        'Other': 'exclamation-triangle'
    };

    const statusColor = statusColors[report.status] || 'secondary';
    const icon = iconMap[report.category] || 'exclamation-triangle';
    const date = new Date(report.createdUtc).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
        <div class="card admin-card mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h5 class="card-title mb-1">
                                    <i class="bi bi-${icon} me-2"></i>${report.category}
                                </h5>
                                <div class="d-flex align-items-center gap-2 mb-2">
                                    <span class="badge bg-secondary">
                                        <i class="bi bi-hash"></i>${report.referenceNumber}
                                    </span>
                                    <span class="badge bg-${statusColor}">
                                        ${formatStatus(report.status)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <p class="card-text mb-2">
                            <strong><i class="bi bi-geo-alt-fill text-primary"></i> Location:</strong> ${report.location}
                        </p>
                        
                        <p class="card-text mb-2">
                            <strong><i class="bi bi-file-text text-info"></i> Description:</strong><br>
                            ${report.description || 'No description provided'}
                        </p>
                        
                        <p class="card-text text-muted mb-0">
                            <i class="bi bi-calendar3"></i> Submitted: ${date}
                            ${report.userId ? `<i class="bi bi-person ms-3"></i> User: ${report.userId}` : ''}
                        </p>
                    </div>
                    
                    <div class="col-md-4">
                        <div class="card bg-light">
                            <div class="card-body">
                                <h6 class="card-subtitle mb-3 text-muted">
                                    <i class="bi bi-gear"></i> Manage Request
                                </h6>
                                
                                <select class="form-select status-dropdown mb-3" id="status-${report.referenceNumber}" data-current="${report.status}">
                                    <option value="Pending" ${report.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                    <option value="InProgress" ${report.status === 'InProgress' ? 'selected' : ''}>In Progress</option>
                                    <option value="Resolved" ${report.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                                    <option value="Rejected" ${report.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                                </select>
                                
                                <button class="btn btn-primary w-100 update-btn mb-2" onclick="updateStatus('${report.referenceNumber}')">
                                    <i class="bi bi-check-circle"></i> Update Status
                                </button>

                                <div class="d-grid gap-2">
                                    ${report.status === 'Pending' ? `
                                        <button class="btn btn-sm btn-success" onclick="quickUpdateStatus('${report.referenceNumber}', 'InProgress')">
                                            <i class="bi bi-check-circle"></i> Verify & Start
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="quickUpdateStatus('${report.referenceNumber}', 'Rejected')">
                                            <i class="bi bi-x-circle"></i> Reject Report
                                        </button>
                                    ` : ''}
                                    ${report.status === 'InProgress' ? `
                                        <button class="btn btn-sm btn-success" onclick="quickUpdateStatus('${report.referenceNumber}', 'Resolved')">
                                            <i class="bi bi-check-circle-fill"></i> Mark Complete
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function formatStatus(status) {
    const formatted = {
        'Pending': 'Pending',
        'InProgress': 'In Progress',
        'Resolved': 'Resolved',
        'Rejected': 'Rejected'
    };
    return formatted[status] || status;
}

async function updateStatus(referenceNumber) {
    const selectElement = document.getElementById(`status-${referenceNumber}`);
    const newStatus = selectElement.value;
    const currentStatus = selectElement.getAttribute('data-current');

    if (newStatus === currentStatus) {
        showToast('No changes detected', 'info');
        return;
    }

    const button = event.target.closest('button');
    const originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';

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
            showToast('Status updated successfully!', 'success');
            selectElement.setAttribute('data-current', newStatus);
            
     
            setTimeout(() => {
                loadServiceRequests(true);
            }, 500);
        } else {
            showToast(result.message || 'Failed to update status', 'error');
            selectElement.value = currentStatus; 
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Error updating status', 'error');
        selectElement.value = currentStatus; 
    } finally {
        button.disabled = false;
        button.innerHTML = originalHtml;
    }
}

function refreshData() {
    const refreshIcon = document.getElementById('refreshIcon');
    refreshIcon.classList.add('refresh-indicator');
    
    loadServiceRequests().then(() => {
        setTimeout(() => {
            refreshIcon.classList.remove('refresh-indicator');
        }, 1000);
    });
}

window.refreshData = refreshData;
window.updateStatus = updateStatus;

window.quickUpdateStatus = async function(referenceNumber, newStatus) {
    let message = `Are you sure you want to change this request to ${formatStatus(newStatus)}?`;
    
    // Custom messages for verification actions
    if (newStatus === 'InProgress') {
        message = 'Verify and start working on this report?';
    } else if (newStatus === 'Rejected') {
        message = 'Reject this report? This action indicates the report is invalid or outside municipal jurisdiction.';
    } else if (newStatus === 'Resolved') {
        message = 'Mark this report as resolved? The issue should be completely addressed.';
    }
    
    const confirmed = confirm(message);
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
            showToast(`Status updated to ${formatStatus(newStatus)}!`, 'success');
            setTimeout(() => {
                loadServiceRequests(true);
            }, 500);
        } else {
            showToast(result.message || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Error updating status', 'error');
    }
};

function showToast(message, type = 'success') {
    const toastEl = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    const toastHeader = toastEl.querySelector('.toast-header');
    
    
    toastHeader.className = 'toast-header text-white';
    if (type === 'success') {
        toastHeader.classList.add('bg-success');
    } else if (type === 'error') {
        toastHeader.classList.add('bg-danger');
    } else {
        toastHeader.classList.add('bg-info');
    }
    
    toastMessage.textContent = message;
    
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 3000
    });
    toast.show();
}

function showError(message) {
    showToast(message, 'error');
}


window.bulkAction = function(action) {
    showToast('Bulk actions coming soon!', 'info');
};

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
});

