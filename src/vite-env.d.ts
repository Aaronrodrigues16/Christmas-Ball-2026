/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RSVP_WEB3FORMS_KEY?: string
  readonly VITE_RSVP_FORMSPREE_ID?: string
  readonly VITE_PRETIX_SHOP_URL?: string
  readonly VITE_PRETIX_WIDGET_URL?: string
  readonly VITE_PRETIX_EVENT?: string
  readonly VITE_PRETIX_BASE_URL?: string
  readonly VITE_PRETIX_ADMIN_URL?: string
  readonly VITE_BOOKING_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
