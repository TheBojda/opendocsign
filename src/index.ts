import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap'
import 'github-fork-ribbon-css/gh-fork-ribbon.css';
import { createApp } from 'vue/dist/vue.esm-bundler.js';
import SignerProfile from './components/SignerProfile.vue'

globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = true;

createApp(SignerProfile).mount('#signer-profile')

