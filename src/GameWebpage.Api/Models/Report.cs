namespace GameWebpage.Api.Models;

public class Report
{
    public int Id { get; set; }
    public int UserId { get; set; }

    public string? Title { get; set; }
    public string Message { get; set; } = "";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
