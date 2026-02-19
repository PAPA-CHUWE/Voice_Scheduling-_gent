import request from "supertest";
import app from "../src/app.js";

describe("GET /api/v1/health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
    expect(typeof res.body.data.uptime).toBe("number");
    expect(res.body.data.timestamp).toBeDefined();
  });
});
