namespace GameWebpage.Api.Contracts;

public record RegisterRequest(string Username, string Password);
public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token);
