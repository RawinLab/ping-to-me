import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { PlansService } from "./plans.service";

@ApiTags("Plans")
@Controller("plans")
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  /**
   * GET /plans - List available plans (public)
   */
  @Get()
  @ApiOperation({ summary: "List all available plans" })
  @ApiResponse({ status: 200, description: "List of available plans" })
  async getPlans() {
    return this.plansService.getPlans();
  }

  /**
   * GET /plans/:id - Get plan details (public)
   */
  @Get(":id")
  @ApiOperation({ summary: "Get plan details by name" })
  @ApiResponse({ status: 200, description: "Plan details" })
  async getPlanByName(@Param("id") name: string) {
    return this.plansService.getPlanByName(name);
  }

  /**
   * GET /plans/compare - Feature comparison matrix (public)
   */
  @Get("compare/all")
  @ApiOperation({ summary: "Get feature comparison matrix for all plans" })
  @ApiResponse({ status: 200, description: "Feature comparison matrix" })
  async comparePlans() {
    return this.plansService.getComparisonMatrix();
  }
}
