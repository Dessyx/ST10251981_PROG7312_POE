using System.Threading.Tasks;
using CityPulse.Models;
using CityPulse.Services.Abstractions;
using Microsoft.AspNetCore.Mvc;    // imports

namespace CityPulse.Controllers
{
	// ----------------------------------------------------------------------------
	// Reporting services controller
	public class ReportIssuesController : Controller
	{
		private readonly IIssueReportingService _service;

		public ReportIssuesController(IIssueReportingService service)
		{
			_service = service;
		}
		 //-----------------------------------------------------------------------
		[HttpGet]
		public IActionResult Create()  // display create view
		{
			return View();
		}

	//-------------------------------------------------------------------------
	[HttpPost]
	[ValidateAntiForgeryToken]
	public async Task<IActionResult> Create([FromForm] string location, [FromForm] IssueCategory category, [FromForm] string description)
	{
	
		var userId = HttpContext.Session.GetString("UserId");
		
		var request = new IssueReportCreateRequest 
		{
			Location = location,
			Category = category,
			Description = description
		};

		foreach (var file in Request.Form.Files)
		{
			request.UploadQueue.Enqueue(file); // upload files
		}

		if (!TryValidateModel(request))
		{
			ModelState.AddModelError("", "Please correct the errors and try again.");
			return View();
		}

		IssueReport report;
		try
		{
			report = await _service.CreateAsync(request, userId);
		}
		catch (System.Exception ex)
		{
			ModelState.AddModelError("", ex.Message);
			return View();
		}

        TempData["ReferenceNumber"] = report.ReferenceNumber;
        return RedirectToAction("Success");
     
    }
		 
		//---------------------------------------------------------------------
		[HttpGet]
		public IActionResult Success()
		{
			ViewBag.ReferenceNumber = TempData["ReferenceNumber"]?.ToString();
			return View();
		}

	//--------------------------------------------------------------------
	[HttpGet]
	public IActionResult LocationSuggest([FromQuery] string q)
	{
		var suggestions = _service.GetLocationSuggestions(q);
		return Json(new { suggestions = suggestions });
	}

	//--------------------------------------------------------------------
	[HttpGet]
	public IActionResult GetReports()
	{
		var userId = HttpContext.Session.GetString("UserId");
		var isAdmin = HttpContext.Session.GetString("IsAdmin") == "true";
		
		List<IssueReport> reports;
		if (isAdmin)
		{
		
			reports = _service.GetAllReports();
		}
		else if (!string.IsNullOrEmpty(userId))
		{
		
			reports = _service.GetReportsByUserId(userId);
		}
		else
		{
		
			reports = _service.GetAllReports();
		}

	
		var result = reports.Select(r => new
		{
			referenceNumber = r.ReferenceNumber,
			location = r.Location,
			category = r.Category.ToString(),
			description = r.Description,
			status = r.Status.ToString(),
			createdUtc = r.CreatedUtc,
			userId = r.UserId
		}).ToList();

		return Json(result);
	}

	//--------------------------------------------------------------------
	[HttpGet]
	public IActionResult SearchByReference([FromQuery] string refNumber)
	{
		// Binary Search Tree - O(log n) search
		var report = _service.SearchByReference(refNumber);
		
		if (report == null)
			return Json(new { found = false });

		return Json(new 
		{ 
			found = true,
			report = new
			{
				referenceNumber = report.ReferenceNumber,
				location = report.Location,
				category = report.Category.ToString(),
				description = report.Description,
				status = report.Status.ToString(),
				createdUtc = report.CreatedUtc
			}
		});
	}

	//--------------------------------------------------------------------
	[HttpGet]
	public IActionResult GetPriorityReports()
	{
		// Min-Heap - Get reports sorted by priority
		var reports = _service.GetPriorityReports();
		
		var result = reports.Select(r => new
		{
			referenceNumber = r.ReferenceNumber,
			location = r.Location,
			category = r.Category.ToString(),
			description = r.Description,
			status = r.Status.ToString(),
			createdUtc = r.CreatedUtc
		}).ToList();

		return Json(result);
	}

	//--------------------------------------------------------------------
	[HttpGet]
	public IActionResult GetRelatedReports([FromQuery] string refNumber)
	{
		// Graph - Find related reports
		var reports = _service.GetRelatedReports(refNumber);
		
		var result = reports.Select(r => new
		{
			referenceNumber = r.ReferenceNumber,
			location = r.Location,
			category = r.Category.ToString(),
			description = r.Description,
			status = r.Status.ToString(),
			createdUtc = r.CreatedUtc,
			relationType = "related"
		}).ToList();

		return Json(result);
	}

	//--------------------------------------------------------------------
	[HttpGet]
	public IActionResult GetReportsByLocation([FromQuery] string refNumber)
	{
		// Graph - Find reports in the same location
		var reports = _service.GetReportsByLocationProximity(refNumber);
		
		var result = reports.Select(r => new
		{
			referenceNumber = r.ReferenceNumber,
			location = r.Location,
			category = r.Category.ToString(),
			description = r.Description,
			status = r.Status.ToString(),
			createdUtc = r.CreatedUtc
		}).ToList();

		return Json(result);
	}

	//--------------------------------------------------------------------
	[HttpGet]
	public IActionResult GetReportsByCategory([FromQuery] string refNumber)
	{
		// Graph - Find reports in the same category
		var reports = _service.GetReportsByCategoryRelation(refNumber);
		
		var result = reports.Select(r => new
		{
			referenceNumber = r.ReferenceNumber,
			location = r.Location,
			category = r.Category.ToString(),
			description = r.Description,
			status = r.Status.ToString(),
			createdUtc = r.CreatedUtc
		}).ToList();

		return Json(result);
	}

	//--------------------------------------------------------------------
	[HttpGet]
	public IActionResult TraverseBFS([FromQuery] string startRef)
	{
		// Graph - Breadth-First Search traversal
		var reports = _service.TraverseBreadthFirst(startRef);
		
		var result = reports.Select((r, index) => new
		{
			referenceNumber = r.ReferenceNumber,
			location = r.Location,
			category = r.Category.ToString(),
			description = r.Description,
			status = r.Status.ToString(),
			createdUtc = r.CreatedUtc,
			traversalOrder = index + 1
		}).ToList();

		return Json(new { algorithm = "BFS", reports = result });
	}

	//--------------------------------------------------------------------
	[HttpGet]
	public IActionResult TraverseDFS([FromQuery] string startRef)
	{
		// Graph - Depth-First Search traversal
		var reports = _service.TraverseDepthFirst(startRef);
		
		var result = reports.Select((r, index) => new
		{
			referenceNumber = r.ReferenceNumber,
			location = r.Location,
			category = r.Category.ToString(),
			description = r.Description,
			status = r.Status.ToString(),
			createdUtc = r.CreatedUtc,
			traversalOrder = index + 1
		}).ToList();

		return Json(new { algorithm = "DFS", reports = result });
	}

	//--------------------------------------------------------------------
	[HttpGet]
	public IActionResult GetDataStructureStats()
	{
	
		var stats = _service.GetDataStructureStats();
		return Json(stats);
	}

	//--------------------------------------------------------------------
	[HttpGet]
	public IActionResult GetReportsByDateRange([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
	{
		// AVL Tree -  range query
		var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
		var end = endDate ?? DateTime.UtcNow;
		
		var reports = _service.GetReportsByDateRange(start, end);
		
		var result = reports.Select(r => new
		{
			referenceNumber = r.ReferenceNumber,
			location = r.Location,
			category = r.Category.ToString(),
			description = r.Description,
			status = r.Status.ToString(),
			createdUtc = r.CreatedUtc
		}).ToList();

		return Json(result);
	}
}
}

//----------------------------------------------- <<< End of File >>>--------------------------------

