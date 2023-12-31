<template>
  <form
    ref="form"
    class="needs-validation"
    :class="{ 'was-validated': formValidated }"
    novalidate
  >
    <div class="mb-3" v-for="field in fields" :key="field.name">
      <label
        :for="field.name"
        class="form-label"
        :style="{ fontWeight: field.required ? 'bold' : 'normal' }"
        >{{ field.label }}{{ field.required ? "" : " (Optional)" }}</label
      >
      <input
        type="text"
        class="form-control"
        :id="field.name"
        :required="field.required"
        v-model="formValues[field.name]"
      />
      <div class="form-text" v-if="field.description">
        {{ field.description }}
      </div>
    </div>
    <div class="mb-3">
      <label for="profileHash" class="form-label">Profile HASH</label>
      <input
        v-model="profileHash"
        type="text"
        class="form-control"
        id="profileHash"
        readonly
        disabled
      />
    </div>
    <div class="mb-3">
      <label for="profileSignature" class="form-label">Profile signature</label>
      <input
        v-model="profileSignature"
        type="text"
        class="form-control"
        id="profileSignature"
        readonly
        disabled
      />
    </div>
    <button type="button" class="btn btn-primary" @click="sign">
      Sign profile
    </button>
    <button
      type="button"
      class="btn btn-success ms-1"
      v-if="downloadVisible"
      @click="downloadData"
    >
      Save profile as JSON
    </button>
  </form>
</template>

<script lang="ts">
import { Component, Vue, toNative } from "vue-facing-decorator";
import detectEthereumProvider from "@metamask/detect-provider";
import {
  generateSignerProfile,
  signer_profile_fields,
} from "../utils/signer_profile_utils";
import { hashTypedData, recoverSignature } from "../utils/eip712utils";
import { saveJSONAsFile } from "../utils/json_file_utils";

@Component
class SignerProfile extends Vue {
  fields = signer_profile_fields;
  formValues: any = {};
  profileHash = "";
  profileSignature = "";
  downloadVisible = false;
  formValidated = false;

  async sign() {
    this.formValidated = true;

    const form = this.$refs.form as HTMLFormElement;
    if (!form.checkValidity()) return;

    const ethereum: any = await detectEthereumProvider();
    if (!ethereum) {
      alert("Please install MetaMask or use a web3 browser!");
      return;
    }

    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    if (accounts[0] != this.formValues.ethereumAddress) {
      alert(
        `Invalid Ethereum address! Your current address in MetaMask is ${accounts[0]} but ${this.formValues.ethereumAddress} is set.`
      );
      return;
    }

    const chainId = await ethereum.request({ method: "eth_chainId" });
    if (chainId != this.formValues.KYCContractChainID) {
      alert(
        `Invalid chain ID! Your current chain ID in MetaMask is ${chainId}`
      );
      return;
    }

    const signer_profile = generateSignerProfile(
      this.formValues.KYCContractAddress,
      this.formValues.KYCContractChainID,
      this.formValues
    );

    const signature = await ethereum.request({
      method: "eth_signTypedData_v4",
      params: [accounts[0], signer_profile],
    });

    this.profileSignature = signature;
    this.profileHash = hashTypedData(signer_profile);

    // check
    const signerAddress = recoverSignature(
      this.profileHash,
      this.profileSignature
    );
    if (this.formValues.ethereumAddress != signerAddress) {
      alert(
        `Something is worng with the signature. :( The recovered address is ${signerAddress} and your address is ${this.formValues.ethereumAddress}`
      );
      return;
    }

    this.downloadVisible = true;
  }

  downloadData() {
    const signer_profile = generateSignerProfile(
      this.formValues.KYCContractAddress,
      this.formValues.KYCContractChainID,
      this.formValues
    );

    const json = {
      profile: signer_profile,
      signature: this.profileSignature,
      hash: this.profileHash,
    };

    saveJSONAsFile(json, "profile.json");
  }
}

export default toNative(SignerProfile);
</script>
