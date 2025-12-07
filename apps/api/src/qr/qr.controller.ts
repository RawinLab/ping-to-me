import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  Res,
  UseGuards,
  Request,
} from "@nestjs/common";
import { Response } from "express";
import { QrCodeService, QrCodeOptions } from "./qr.service";
import { AuthGuard } from "../auth/auth.guard";
import { BatchDownloadDto } from "./dto/batch-download.dto";

class GenerateAdvancedQrDto {
  url: string;
  foregroundColor?: string;
  backgroundColor?: string;
  logo?: string;
  logoSize?: number;
  size?: number;
  margin?: number;
  errorCorrection?: "L" | "M" | "Q" | "H";
}

@Controller("qr")
export class QrCodeController {
  constructor(private readonly qrService: QrCodeService) {}

  @Post("generate")
  @UseGuards(AuthGuard)
  async generate(@Request() req, @Body() body: { url: string; slug: string }) {
    return this.qrService.generateQrCode(body.url, body.slug);
  }

  @Post("custom")
  @UseGuards(AuthGuard)
  async custom(
    @Body() body: { url: string; color?: string; bgcolor?: string },
  ) {
    return this.qrService.generateCustomQr(body.url, {
      color: body.color,
      bgcolor: body.bgcolor,
    });
  }

  @Post("advanced")
  @UseGuards(AuthGuard)
  async advanced(@Body() dto: GenerateAdvancedQrDto) {
    return this.qrService.generateAdvancedQr(dto as QrCodeOptions);
  }

  @Get("preview")
  async preview(
    @Query("url") url: string,
    @Query("fg") foregroundColor?: string,
    @Query("bg") backgroundColor?: string,
    @Query("size") size?: string,
  ) {
    return this.qrService.generateAdvancedQr({
      url,
      foregroundColor: foregroundColor || "#000000",
      backgroundColor: backgroundColor || "#FFFFFF",
      size: size ? parseInt(size) : 200,
    });
  }

  @Get("download")
  @UseGuards(AuthGuard)
  async download(
    @Query("url") url: string,
    @Query("fg") foregroundColor: string,
    @Query("bg") backgroundColor: string,
    @Query("size") size: string,
    @Query("format") format: string,
    @Res() res: Response,
  ) {
    const sizeNum = size ? parseInt(size) : 300;

    if (format === "svg") {
      const svg = await this.qrService.generateSvgQr(url, {
        color: foregroundColor || "#000000",
        bgcolor: backgroundColor || "#FFFFFF",
        size: sizeNum,
      });
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Content-Disposition", 'attachment; filename="qrcode.svg"');
      res.send(svg);
    } else if (format === "pdf") {
      const pdfBuffer = await this.qrService.generatePdfQr({
        url,
        foregroundColor: foregroundColor || "#000000",
        backgroundColor: backgroundColor || "#FFFFFF",
        size: sizeNum,
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="qrcode.pdf"');
      res.send(pdfBuffer);
    } else {
      const { dataUrl } = await this.qrService.generateAdvancedQr({
        url,
        foregroundColor: foregroundColor || "#000000",
        backgroundColor: backgroundColor || "#FFFFFF",
        size: sizeNum,
      });
      // Convert base64 to buffer
      const base64Data = dataUrl.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", 'attachment; filename="qrcode.png"');
      res.send(buffer);
    }
  }

  @Post("batch-download")
  @UseGuards(AuthGuard)
  async batchDownload(@Body() dto: BatchDownloadDto, @Res() res: Response) {
    const zipBuffer = await this.qrService.batchGenerateQr(
      dto.linkIds,
      dto.format || "png",
      dto.size || 300,
    );
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="qrcodes.zip"');
    res.send(zipBuffer);
  }
}
