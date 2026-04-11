namespace GameWebpage.Api.Contracts;

public record CreateReviewRequest(int Rating, string Message);

public record ReviewListItem(
    string Username,
    int Rating,
    string Message,
    DateTime CreatedAt
);
