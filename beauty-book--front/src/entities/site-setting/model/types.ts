export type SiteSetting = {
  heroImageUrl: string | null;
  introTitle: string;
  introSubtitle: string;
  updatedAt: string;
};

export type MailSetting = {
  reservationRequestEmails: string[];
  updatedAt: string;
};
