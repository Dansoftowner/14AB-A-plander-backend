import i18next from 'i18next'
import middleware from 'i18next-http-middleware'
import Backend, { FsBackendOptions } from 'i18next-fs-backend'

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init<FsBackendOptions>({
    backend: {
      loadPath: 'resources/locales/{{lng}}/{{ns}}.json',
      addPath: 'resources/locales/{{lng}}/{{ns}}.missing.json',
    },
    fallbackLng: 'en',
    ns: ['errors'],
    preload: ['en', 'hu'],
  })

export default i18next
