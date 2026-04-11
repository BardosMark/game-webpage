using System.Security.Claims;
using GameWebpage.Api.Contracts;
using GameWebpage.Api.Data;
using GameWebpage.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GameWebpage.Api.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReportsController(AppDbContext db) => _db = db;

    // védett: report létrehozás (nem listázzuk)
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(CreateReportRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Message)) return BadRequest(new { error = "message is required" });

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdStr, out var userId)) return Unauthorized(new { error = "invalid token" });

        var report = new Report
        {
            UserId = userId,
            Title = string.IsNullOrWhiteSpace(req.Title) ? null : req.Title.Trim(),
            Message = req.Message.Trim()
        };

        _db.Reports.Add(report);
        await _db.SaveChangesAsync();

        return Ok(new { ok = true, id = report.Id });
    }
}
