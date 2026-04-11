using System.Security.Claims;
using GameWebpage.Api.Contracts;
using GameWebpage.Api.Data;
using GameWebpage.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GameWebpage.Api.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReviewsController(AppDbContext db) => _db = db;

    // publikus lista: username + rating + message
    [HttpGet]
    public async Task<ActionResult<List<ReviewListItem>>> List()
    {
        var items = await _db.Reviews
            .AsNoTracking()
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewListItem(
                r.User!.Username,
                r.Rating,
                r.Message,
                r.CreatedAt
            ))
            .ToListAsync();

        return Ok(items);
    }

    // védett: review létrehozás
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(CreateReviewRequest req)
    {
        if (req.Rating < 1 || req.Rating > 5) return BadRequest(new { error = "rating must be 1..5" });
        if (string.IsNullOrWhiteSpace(req.Message)) return BadRequest(new { error = "message is required" });

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdStr, out var userId)) return Unauthorized(new { error = "invalid token" });

        var review = new Review
        {
            UserId = userId,
            Rating = req.Rating,
            Message = req.Message.Trim()
        };

        _db.Reviews.Add(review);
        await _db.SaveChangesAsync();
        return Ok(new { ok = true, id = review.Id });
    }
}
