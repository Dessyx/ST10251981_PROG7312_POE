using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using CityPulse.Models;    // imports

namespace CityPulse.Services.Abstractions
{
	// ----------------------------------------------------------------------------
	// Reference number generation service interface
	public interface IReferenceNumberService
	{
		string CreateReference();  
	}

	// ----------------------------------------------------------------------------
	// File storage service interface
	public interface IStorageService
	{
		Task<Attachment> SaveAsync(IFormFile file);  
	}

	// ----------------------------------------------------------------------------
	// Issue reporting service interface with Data Structures
	public interface IIssueReportingService
	{
		Task<IssueReport> CreateAsync(IssueReportCreateRequest request, string userId = null);  

		CityPulse.Models.Queue<string> GetLocationSuggestions(string query);
		List<IssueReport> GetAllReports();
		List<IssueReport> GetReportsByUserId(string userId);
		IssueReport SearchByReference(string referenceNumber); 
		List<IssueReport> GetReportsByDateRange(DateTime startDate, DateTime endDate);
		int GetTreeHeight();
		List<IssueReport> GetPriorityReports();
		List<IssueReport> GetRelatedReports(string referenceNumber);
		List<IssueReport> GetReportsByLocationProximity(string referenceNumber);
		List<IssueReport> GetReportsByCategoryRelation(string referenceNumber);
		Dictionary<string, int> GetRelationshipMetrics();
		List<IssueReport> TraverseBreadthFirst(string startReference);
		List<IssueReport> TraverseDepthFirst(string startReference);
		Dictionary<string, object> GetDataStructureStats();
		
		bool UpdateReportStatus(string referenceNumber, ServiceRequestStatus newStatus);
		Dictionary<ServiceRequestStatus, int> GetStatusStatistics();
	}

	// ----------------------------------------------------------------------------
	// Announcement management service interface
	public interface IAnnouncementService
	{
		void AddAnnouncement(Announcement announcement);  
		Announcement CreateAnnouncementFromViewModel(AnnouncementViewModel viewModel, string createdBy);  
		List<Announcement> GetAllAnnouncements();  
		List<Announcement> GetAnnouncementsByCategory(AnnouncementCategory category);  
		List<Announcement> GetAnnouncementsByDateRange(DateTime startDate, DateTime endDate);  
		List<Announcement> GetRecentAnnouncements(int count);  
		List<Announcement> GetRecentlyCreatedAnnouncements(int count);  
		List<Announcement> GetUpcomingAnnouncements(int count);  
		List<Announcement> GetFeaturedAnnouncements();  
		List<Announcement> SearchAnnouncements(string searchTerm);  
		List<Announcement> SearchWithFilters(string? searchTerm, string? category, DateTime? dateFrom, DateTime? dateTo, int maxResults);  
		Announcement? GetAnnouncementById(Guid id);  
		AdminDashboardViewModel GetDashboardViewModel();  
		HashSet<string> GetUniqueCategories();  
		HashSet<DateTime> GetUniqueDates();  
		void SeedDefaultData();  
	}

	// ----------------------------------------------------------------------------
	// Admin authentication service interface
	public interface IAdminAuthenticationService
	{
		bool ValidateCredentials(string username, string password);  
		bool UserExists(string username);  
	}

	// ----------------------------------------------------------------------------
	// Recommendation service interface - analyzes user patterns and suggests relevant announcements
	public interface IRecommendationService
	{
		void TrackSearch(string userId, string searchTerm, string? category);  
		void TrackView(string userId, Announcement announcement);  
		List<Announcement> GetRecommendations(string userId, int count);  
		List<Announcement> GetTrendingAnnouncements(int count);  
		List<Announcement> GetRelatedAnnouncements(Announcement announcement, int count);  
		Dictionary<AnnouncementCategory, int> GetUserPreferences(string userId);  
	}

	// ----------------------------------------------------------------------------
	// User authentication service interface - manages user accounts
	public interface IUserService
	{
		Task<User?> RegisterAsync(UserRegisterViewModel model);  
		Task<User?> LoginAsync(string usernameOrEmail, string password);  
		User? GetUserById(Guid userId);  
		User? GetUserByUsername(string username);  
		User? GetUserByEmail(string email);  
		bool UsernameExists(string username);   
		bool EmailExists(string email);   
		void UpdateLastLogin(Guid userId);  
	}
}

//----------------------------------------------- <<< End of File >>>-------------------------------- 
