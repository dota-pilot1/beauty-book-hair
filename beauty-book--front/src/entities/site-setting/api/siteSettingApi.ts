import { api } from "@/shared/api/axios";
import type { MailSetting, SiteSetting } from "../model/types";

export type UpdateSiteSettingBody = {
  heroImageUrl: string | null;
  introTitle: string;
  introSubtitle: string;
};

export type UpdateMailSettingBody = {
  reservationRequestEmails: string[];
};

export const siteSettingApi = {
  get: () => api.get<SiteSetting>("/api/site-settings").then((r) => r.data),
  update: (body: UpdateSiteSettingBody) =>
    api.put<SiteSetting>("/api/site-settings", body).then((r) => r.data),
  getMail: () => api.get<MailSetting>("/api/site-settings/mail").then((r) => r.data),
  updateMail: (body: UpdateMailSettingBody) =>
    api.put<MailSetting>("/api/site-settings/mail", body).then((r) => r.data),
};
