let allReports = []; // Store all reports globally

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const requestsContainer = document.getElementById('requestsContainer');
    const emptyState = document.getElementById('emptyState');

  
    loadReports();

    // Filter functionality
    function filterRequests() {
        renderReports(allReports);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterRequests);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', filterRequests);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterRequests);
    }

    async function loadReports() {
        try {
            const response = await fetch('/ReportIssues/GetReports');
            const reports = await response.json();
            allReports = reports;
            renderReports(reports);
            updateStatistics(reports);
            checkForResolvedReports(reports);
        } catch (error) {
            console.error('Error loading reports:', error);
            showToast('Failed to load reports', 'error');
        }
    }

    function checkForResolvedReports(reports) {
        const resolvedReports = reports.filter(r => r.status === 'Resolved');
        
        if (resolvedReports.length > 0) {
            const notice = document.getElementById('resolvedNotice');
            const noticeText = document.getElementById('resolvedNoticeText');
            
            if (resolvedReports.length === 1) {
                noticeText.innerHTML = `Your service request <strong>${resolvedReports[0].referenceNumber}</strong> has been resolved! Thank you for your patience.`;
            } else {
                const refNumbers = resolvedReports.slice(0, 3).map(r => `<strong>${r.referenceNumber}</strong>`).join(', ');
                const extraCount = resolvedReports.length > 3 ? ` and ${resolvedReports.length - 3} more` : '';
                noticeText.innerHTML = `${resolvedReports.length} of your service requests have been resolved: ${refNumbers}${extraCount}. Thank you for your patience!`;
            }
            
            notice.style.display = 'block';
        }
    }

    function renderReports(reports) {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedStatus = statusFilter.value;
        const selectedCategory = categoryFilter.value;

        // Filter reports
        const filteredReports = reports.filter(report => {
            const matchesSearch = searchTerm === '' || 
                                report.referenceNumber.toLowerCase().includes(searchTerm) || 
                                report.description.toLowerCase().includes(searchTerm);
            const matchesStatus = selectedStatus === 'all' || report.status.toLowerCase() === selectedStatus;
            const matchesCategory = selectedCategory === 'all' || report.category.toLowerCase() === selectedCategory;
            return matchesSearch && matchesStatus && matchesCategory;
        });

        requestsContainer.innerHTML = '';

        if (filteredReports.length === 0) {
            requestsContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        requestsContainer.style.display = 'block';
        emptyState.style.display = 'none';

        filteredReports.forEach(report => {
            const reportCard = createReportCard(report);
            requestsContainer.appendChild(reportCard);
        });
    }

    function createReportCard(report) {
        const col = document.createElement('div');
        col.className = 'col-12';
        col.setAttribute('data-status', report.status.toLowerCase());
        col.setAttribute('data-category', report.category.toLowerCase());

        const statusMap = {
            'Pending': 'pending',
            'InProgress': 'inprogress',
            'Resolved': 'resolved',
            'Rejected': 'rejected'
        };

        const iconMap = {
            'Sanitation': 'trash',
            'Roads': 'cone-striped',
            'Utilities': 'tools',
            'Water': 'droplet-fill',
            'Electricity': 'lightning-charge-fill',
            'Other': 'exclamation-triangle'
        };

        const statusClass = statusMap[report.status] || 'pending';
        const icon = iconMap[report.category] || 'exclamation-triangle';
        const date = new Date(report.createdUtc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        col.innerHTML = `
            <div class="request-card">
                <div class="request-header">
                    <div class="request-ref">
                        <i class="bi bi-hash"></i>
                        <span class="ref-number">${report.referenceNumber}</span>
                        <button class="btn btn-sm btn-copy" onclick="copyReference('${report.referenceNumber}')" title="Copy Reference Number">
                            <i class="bi bi-clipboard"></i>
                        </button>
                    </div>
                    <span class="badge status-badge status-${statusClass}">
                        <i class="bi bi-${getStatusIcon(report.status)} me-1"></i>${formatStatus(report.status)}
                    </span>
                </div>
                <div class="request-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h5 class="request-title">
                                <i class="bi bi-${icon} me-2 text-muted"></i>${report.category}
                            </h5>
                            <p class="request-description">
                                ${report.description || 'No description provided.'}
                            </p>
                            <div class="request-details">
                                <span class="detail-item">
                                    <i class="bi bi-geo-alt-fill"></i>
                                    ${report.location}
                                </span>
                                <span class="detail-item">
                                    <i class="bi bi-calendar3"></i>
                                    ${date}
                                </span>
                            </div>
                            <div class="mt-2">
                                <button class="btn btn-sm btn-outline-primary me-1" onclick="showRelatedReports('${report.referenceNumber}')" title="Find Related Reports (Graph)">
                                    <i class="bi bi-diagram-3"></i> Related
                                </button>
                                <button class="btn btn-sm btn-outline-secondary me-1" onclick="showLocationProximity('${report.referenceNumber}')" title="Same Location (Graph)">
                                    <i class="bi bi-geo-alt"></i> Location
                                </button>
                                <button class="btn btn-sm btn-outline-info" onclick="showCategoryRelation('${report.referenceNumber}')" title="Same Category (Graph)">
                                    <i class="bi bi-tag"></i> Category
                                </button>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="request-timeline">
                                ${createTimeline(report.status, date)}
                            </div>
                        </div>
                    </div>
                    <div id="related-${report.referenceNumber}" class="mt-3" style="display: none;">
                        <!-- Related reports will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        return col;
    }

    function getStatusIcon(status) {
        const icons = {
            'Pending': 'hourglass-split',
            'InProgress': 'gear-fill',
            'Resolved': 'check-circle-fill',
            'Rejected': 'x-circle-fill'
        };
        return icons[status] || 'hourglass-split';
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

    function createTimeline(status, date) {
        const isResolved = status === 'Resolved';
        const isInProgress = status === 'InProgress';
        const isRejected = status === 'Rejected';

        let timeline = `
            <div class="timeline-item ${isResolved || isInProgress || isRejected ? 'completed' : 'active'}">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="timeline-title">Submitted</div>
                    <div class="timeline-time">${date}</div>
                </div>
            </div>
        `;

        if (!isRejected) {
            timeline += `
                <div class="timeline-item ${isResolved ? 'completed' : (isInProgress ? 'active' : '')}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-title">Under Review</div>
                        <div class="timeline-time">${isInProgress || isResolved ? date : 'Pending'}</div>
                    </div>
                </div>
                <div class="timeline-item ${isResolved ? 'completed' : ''}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-title">Resolved</div>
                        <div class="timeline-time">${isResolved ? date : 'Pending'}</div>
                    </div>
                </div>
            `;
        } else {
            timeline += `
                <div class="timeline-item completed">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-title">Reviewed</div>
                        <div class="timeline-time">${date}</div>
                    </div>
                </div>
                <div class="timeline-item rejected">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-title">Rejected</div>
                        <div class="timeline-time">${date}</div>
                    </div>
                </div>
            `;
        }

        return timeline;
    }

    function updateStatistics(reports) {
        const stats = {
            pending: reports.filter(r => r.status === 'Pending').length,
            inprogress: reports.filter(r => r.status === 'InProgress').length,
            resolved: reports.filter(r => r.status === 'Resolved').length,
            rejected: reports.filter(r => r.status === 'Rejected').length
        };

        const statNumbers = document.querySelectorAll('.stat-number');
        if (statNumbers.length >= 4) {
            statNumbers[0].textContent = stats.pending;
            statNumbers[1].textContent = stats.inprogress;
            statNumbers[2].textContent = stats.resolved;
            statNumbers[3].textContent = stats.rejected;
        }
    }
});

// Copy reference number to clipboard
function copyReference(refNumber) {
    navigator.clipboard.writeText(refNumber).then(() => {

        const button = event.target.closest('.btn-copy');
        const originalHTML = button.innerHTML;
        
        button.innerHTML = '<i class="bi bi-check2"></i>';
        button.classList.add('btn-success');
        button.classList.remove('btn-copy');

        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('btn-success');
            button.classList.add('btn-copy');
        }, 2000);

        showToast('Reference number copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy reference number', 'error');
    });
}

function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
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
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

window.copyReference = copyReference;

// Graph-based related reports functions
window.showRelatedReports = async function(refNumber) {
    const container = document.getElementById(`related-${refNumber}`);
    if (container.style.display === 'block') {
        container.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`/ReportIssues/GetRelatedReports?refNumber=${refNumber}`);
        const reports = await response.json();
        
        if (reports.length === 0) {
            container.innerHTML = '<div class="alert alert-warning">No related reports found.</div>';
        } else {
            container.innerHTML = `
                <div class="alert alert-success">
                    <strong><i class="bi bi-diagram-3"></i> Related Reports (Graph Relationships):</strong>
                    <ul class="list-unstyled mt-2 mb-0">
                        ${reports.map(r => `
                            <li class="mb-1">
                                <i class="bi bi-arrow-right-circle"></i>
                                <strong>${r.referenceNumber}</strong> - ${r.location} (${r.category})
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        container.style.display = 'block';
    } catch (error) {
        console.error('Error loading related reports:', error);
        showToast('Failed to load related reports', 'error');
    }
};

window.showLocationProximity = async function(refNumber) {
    const container = document.getElementById(`related-${refNumber}`);
    if (container.style.display === 'block') {
        container.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`/ReportIssues/GetReportsByLocation?refNumber=${refNumber}`);
        const reports = await response.json();
        
        if (reports.length === 0) {
            container.innerHTML = '<div class="alert alert-warning">No reports found in the same location.</div>';
        } else {
            container.innerHTML = `
                <div class="alert alert-info">
                    <strong><i class="bi bi-geo-alt"></i> Same Location Reports (Graph - Location Edges):</strong>
                    <ul class="list-unstyled mt-2 mb-0">
                        ${reports.map(r => `
                            <li class="mb-1">
                                <i class="bi bi-geo"></i>
                                <strong>${r.referenceNumber}</strong> - ${r.category} - ${r.status}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        container.style.display = 'block';
    } catch (error) {
        console.error('Error loading location proximity:', error);
        showToast('Failed to load location reports', 'error');
    }
};

window.showCategoryRelation = async function(refNumber) {
    const container = document.getElementById(`related-${refNumber}`);
    if (container.style.display === 'block') {
        container.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`/ReportIssues/GetReportsByCategory?refNumber=${refNumber}`);
        const reports = await response.json();
        
        if (reports.length === 0) {
            container.innerHTML = '<div class="alert alert-warning">No reports found in the same category.</div>';
        } else {
            container.innerHTML = `
                <div class="alert alert-primary">
                    <strong><i class="bi bi-tag"></i> Same Category Reports (Graph - Category Edges):</strong>
                    <ul class="list-unstyled mt-2 mb-0">
                        ${reports.map(r => `
                            <li class="mb-1">
                                <i class="bi bi-tag-fill"></i>
                                <strong>${r.referenceNumber}</strong> - ${r.location} - ${r.status}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        container.style.display = 'block';
    } catch (error) {
        console.error('Error loading category relations:', error);
        showToast('Failed to load category reports', 'error');
    }
};

