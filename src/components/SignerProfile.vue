<template>
  <form ref="form" class="needs-validation" novalidate>
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
import { generateSignerProfile } from "../utils/signer_profile_utils";
import { hashTypedData, recoverSignature } from "../utils/eip712utils";

@Component
class SignerProfile extends Vue {
  fields = [
    {
      name: "name",
      label: "Full name",
      required: true,
      description: "Name of the signer person",
    },
    {
      name: "address",
      label: "Full address",
      required: true,
      description: "Address of the signer person",
    },
    {
      name: "govID",
      label: "Government ID",
      required: true,
      description: "A government ID is uniquely identifies the signer person",
    },
    {
      name: "ethereumAddress",
      label: "Ethereum address",
      required: true,
      description:
        "The signer profile will be assigned to this Ethereum address",
    },
    { name: "organizationName", label: "Organization name", required: false },
    {
      name: "organizationAddress",
      label: "Organization address",
      required: false,
    },
    {
      name: "organizationID",
      label: "Organization registration number",
      required: false,
    },
    {
      name: "KYCContractChainID",
      label: "Chain ID of the KYC Contract",
      required: true,
    },
    {
      name: "KYCContractAddress",
      label: "KYC Contract address",
      required: true,
    },
  ];

  formValues: any = {};

  profileHash = "";
  profileSignature = "";

  downloadVisible = false;

  async sign() {
    const form = this.$refs.form as HTMLFormElement;
    form.checkValidity();
    form.classList.add("was-validated");
    console.log();

    const ethereum: any = await detectEthereumProvider();
    if (!ethereum) {
      alert("Please install MetaMask or use a web3 browser!");
      return;
    }

    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    if (accounts[0] != this.formValues.ethereumAddress) {
      alert(
        `Invalid Ethereum address! Your current address in MetaMask is ${accounts[0]}`
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

    const jsonData = {
      profile: signer_profile,
      signature: this.profileSignature,
      hash: this.profileHash,
    };

    const jsonString = JSON.stringify(jsonData);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "profile.json";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export default toNative(SignerProfile);
</script>
