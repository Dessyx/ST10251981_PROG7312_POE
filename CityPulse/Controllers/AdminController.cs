using Microsoft.AspNetCore.Mvc;
using CityPulse.Models;
using CityPulse.Services.Abstractions;    // imports

namespace CityPulse.Controllers
{
    // ----------------------------------------------------------------------------
    // Admin controller - handles authentication and announcement management
    public class AdminController : Controller 
    {
        private readonly ILogger<AdminController> _logger;
        private readonly IAnnouncementService _announcementService;
        private readonly IAdminAuthenticationService _authService;
        private readonly IIssueReportingService _issueReportingService;

        public AdminController(ILogger<AdminController> logger, IAnnouncementService announcementService, IAdminAuthenticationService authService, IIssueReportingService issueReportingService)
        {
            _logger = logger;
            _announcementService = announcementService;
            _authService = authService;
            _issueReportingService = issueReportingService;
        }

        //-----------------------------------------------------------------------
        [HttpGet]
        public IActionResult Login()  // display admin login page
        {
            return View();
        }

        //-----------------------------------------------------------------------
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Login(AdminLoginViewModel model)  
        {
            if (ModelState.IsValid)
            {
       
                if (_authService.ValidateCredentials(model.Username, model.Password))
                {
                    HttpContext.Session.SetString("IsAdmin", "true");  
                    HttpContext.Session.SetString("AdminUsername", model.Username);  
                    return RedirectToAction("Dashboard");  
                }
                else
                {
                    ModelState.AddModelError("", "Invalid username or password");  
                }
            }
            return View(model);
        }

        //-----------------------------------------------------------------------
        [HttpGet]
        public IActionResult Dashboard()  // display admin dashboard
        {
            if (!IsAdminLoggedIn())  
            {
                return RedirectToAction("Login");
            }

            var viewModel = _announcementService.GetDashboardViewModel();  
            return View(viewModel);
        }

        //-----------------------------------------------------------------------
        [HttpGet]
        public IActionResult AddAnnouncement()  // display add announcement form
        {
            if (!IsAdminLoggedIn())  
            {
                return RedirectToAction("Login");
            }

            var model = new AnnouncementViewModel();  
            return View(model);
        }

        //-----------------------------------------------------------------------
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult AddAnnouncement(AnnouncementViewModel model)  
        {
            if (!IsAdminLoggedIn())  
            {
                return RedirectToAction("Login");
            }

            if (ModelState.IsValid)
            {
                var username = HttpContext.Session.GetString("AdminUsername") ?? "Admin";  
                _announcementService.CreateAnnouncementFromViewModel(model, username);  
                return RedirectToAction("Dashboard");  
            }

            return View(model);  
        }

        //-----------------------------------------------------------------------
        [HttpGet]
        public IActionResult Logout()  // log out admin user
        {
            HttpContext.Session.Remove("IsAdmin");  
            return RedirectToAction("Login");
        }

    //-----------------------------------------------------------------------
    // display service request management page
    [HttpGet]
    public IActionResult ServiceRequests()  
    {
        if (!IsAdminLoggedIn())  
        {
            return RedirectToAction("Login");
        }

        return View();
    }

    //-----------------------------------------------------------------------
    [HttpGet]
    public IActionResult GetAllServiceRequests()  
    {
        if (!IsAdminLoggedIn())  
        {
            return Json(new { error = "Unauthorized" });
        }

        var reports = _issueReportingService.GetAllReports();
        var stats = _issueReportingService.GetStatusStatistics();
        
        var result = new
        {
            reports = reports.Select(r => new
            {
                referenceNumber = r.ReferenceNumber,
                location = r.Location,
                category = r.Category.ToString(),
                description = r.Description,
                status = r.Status.ToString(),
                createdUtc = r.CreatedUtc,
                userId = r.UserId
            }).ToList(),
            statistics = stats.ToDictionary(
                kvp => kvp.Key.ToString(), 
                kvp => kvp.Value
            )
        };

        return Json(result);
    }

    //-----------------------------------------------------------------------
    [HttpPost]
    public IActionResult UpdateReportStatus([FromBody] UpdateStatusRequest request)  
    {
        if (!IsAdminLoggedIn())  
        {
            return Json(new { success = false, message = "Unauthorized" });
        }

        if (string.IsNullOrEmpty(request.ReferenceNumber))
        {
            return Json(new { success = false, message = "Reference number is required" });
        }

        if (!Enum.TryParse<ServiceRequestStatus>(request.Status, out var newStatus))
        {
            return Json(new { success = false, message = "Invalid status" });
        }

        bool success = _issueReportingService.UpdateReportStatus(request.ReferenceNumber, newStatus);

        if (success)
        {
            var report = _issueReportingService.SearchByReference(request.ReferenceNumber);
            return Json(new 
            { 
                success = true, 
                message = "Status updated successfully",
                report = new
                {
                    referenceNumber = report.ReferenceNumber,
                    status = report.Status.ToString()
                }
            });
        }

        return Json(new { success = false, message = "Report not found" });
    }

    //-----------------------------------------------------------------------
    [HttpGet]
    public IActionResult GetServiceRequestStats()  
    {
        if (!IsAdminLoggedIn())  
        {
            return Json(new { error = "Unauthorized" });
        }

        var stats = _issueReportingService.GetStatusStatistics();
        var dsStats = _issueReportingService.GetDataStructureStats();
        
        return Json(new 
        { 
            statusStats = stats.ToDictionary(kvp => kvp.Key.ToString(), kvp => kvp.Value),
            dataStructures = dsStats
        });
    }

    //-----------------------------------------------------------------------
    private bool IsAdminLoggedIn()  // helper method to check admin authentication
    {
        return HttpContext.Session.GetString("IsAdmin") == "true";
    }
}

// Request model for updating status
public class UpdateStatusRequest
{
    public string ReferenceNumber { get; set; }
    public string Status { get; set; }
}

}

//----------------------------------------------- <<< End of File >>>--------------------------------
