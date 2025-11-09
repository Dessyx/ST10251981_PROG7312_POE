using Microsoft.AspNetCore.Mvc;
using CityPulse.Models;    // imports

namespace CityPulse.Controllers
{
	// ----------------------------------------------------------------------------
	// Service Request controller - handles tracking of service requests
	public class ServiceRequestController : Controller
	{
		private readonly ILogger<ServiceRequestController> _logger;

		public ServiceRequestController(ILogger<ServiceRequestController> logger)
		{
			_logger = logger;
		}

		//-----------------------------------------------------------------------
		[HttpGet]
		public IActionResult Request()  // display service request tracking page
		{
			var isAdmin = HttpContext.Session.GetString("IsAdmin") == "true";
			ViewBag.IsAdmin = isAdmin;

			// Check if user is logged in
			var userId = HttpContext.Session.GetString("UserId");
			if (string.IsNullOrEmpty(userId) && !isAdmin)
			{
				
				return RedirectToAction("Index", "Home");
			}

			ViewBag.UserId = userId;

	
			return View();
		}
	}
}

//----------------------------------------------- <<< End of File >>>--------------------------------

