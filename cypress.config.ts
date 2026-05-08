import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'https://admin-hom.sgagenda.com/',

    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',

    video: true,
    screenshotOnRunFailure: true,

    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,

    chromeWebSecurity: false,
    setupNodeEvents(on, config) {

      require('@shelex/cypress-allure-plugin/writer')(on, config);

      return config;
    },
  },
});