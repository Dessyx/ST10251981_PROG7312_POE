

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const requestsContainer = document.getElementById('requestsContainer');
    const emptyState = document.getElementById('emptyState');

    // Filter functionality
    function filterRequests() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedStatus = statusFilter.value;
        const selectedCategory = categoryFilter.value;

        const requests = requestsContainer.querySelectorAll('[data-status]');
        let visibleCount = 0;

        requests.forEach(request => {
            const status = request.getAttribute('data-status');
            const category = request.getAttribute('data-category');
            const refNumber = request.querySelector('.ref-number').textContent.toLowerCase();
            const description = request.querySelector('.request-description').textContent.toLowerCase();

            // filtering
            const matchesSearch = searchTerm === '' || 
                                refNumber.includes(searchTerm) || 
                                description.includes(searchTerm);
            const matchesStatus = selectedStatus === 'all' || status === selectedStatus;
            const matchesCategory = selectedCategory === 'all' || category === selectedCategory;

            if (matchesSearch && matchesStatus && matchesCategory) {
                request.style.display = 'block';
                visibleCount++;
            } else {
                request.style.display = 'none';
            }
        });

        if (visibleCount === 0) {
            requestsContainer.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            requestsContainer.style.display = 'block';
            emptyState.style.display = 'none';
        }
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
    toast.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'x-circle-fill'} me-2"></i>
        ${message}
    `;

    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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

