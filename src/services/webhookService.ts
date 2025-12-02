import { prisma } from "./database";

export class WebhookService {
  async createWebhookLog(data: any) {
    await prisma.webhookEvent.create({
      data: { payload: data },
    });
  }
}
