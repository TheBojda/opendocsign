import 'bootstrap/dist/css/bootstrap.css'
import 'github-fork-ribbon-css/gh-fork-ribbon.css';
import 'primevue/resources/themes/lara-light-blue/theme.css'
import '@fortawesome/fontawesome-free/css/all.css'
import 'bootstrap'
import { createApp } from 'vue/dist/vue.esm-bundler.js';
import PrimeVue from 'primevue/config';
import SignerProfile from './components/SignerProfile.vue'
import KYCValidator from './components/KYCValidator.vue'
import CreateDocument from './components/CreateDocument.vue'

globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = true;

createApp(SignerProfile).mount('#signer-profile')
createApp(KYCValidator).use(PrimeVue).mount('#validator')
createApp(CreateDocument).use(PrimeVue).mount('#create-document')

