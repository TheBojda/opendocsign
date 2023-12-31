<template>
  <form>
    <div class="mb-3" v-for="field in fields" :key="field.name">
      <label :for="field.name" class="form-label">{{ field.label }}</label>
      <input
        type="text"
        class="form-control"
        :id="field.name"
        v-model="formValues[field.name]"
        readonly
        disabled
      />
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
    <div class="mb-3">
      <label for="KYCSignature" class="form-label"
        >KYC Validator signature</label
      >
      <input
        v-model="KYCSignature"
        type="text"
        class="form-control"
        id="KYCSignature"
        readonly
        disabled
      />
    </div>
    <div style="display: flex">
      <FileUpload
        mode="basic"
        chooseLabel="Choose profile JSON"
        uploadLabel="Upload"
        accept=".json"
        :class="['btn', 'btn-success']"
        :auto="true"
        :customUpload="true"
        @uploader="handleFileUpload"
      />
      <button
        type="button"
        class="btn btn-primary ms-1"
        v-if="validProfile"
        @click="sign"
      >
        Sign profile
      </button>
      <button
        type="button"
        class="btn btn-primary ms-1"
        v-if="validProfile && validSignature"
        @click="writeToBlockchain"
      >
        Write to the blockchain
      </button>
    </div>
  </form>
</template>

<script lang="ts">
import { Component, Vue, toNative } from "vue-facing-decorator";
import FileUpload from "primevue/fileupload";
import detectEthereumProvider from "@metamask/detect-provider";
import { BrowserProvider, Contract } from "ethers";
import {
  signer_profile_fields,
  generateSignerProfile,
} from "../utils/signer_profile_utils";
import { hashTypedData, recoverSignature } from "../utils/eip712utils";
import { readFileAsJSON } from "../utils/json_file_utils";

@Component({
  components: {
    FileUpload,
  },
})
class KYCValidator extends Vue {
  fields = signer_profile_fields;
  formValues: any = {};
  profileHash = "";
  profileSignature = "";
  KYCSignature = "";
  validProfile = false;
  validSignature = false;

  async handleFileUpload(event) {
    this.validProfile = false;

    try {
      const jsonContent = await readFileAsJSON(event.files[0]);
      this.formValues = jsonContent.profile.message;
      this.formValues.KYCContractChainID = jsonContent.profile.domain.chainId;
      this.formValues.KYCContractAddress =
        jsonContent.profile.domain.verifyingContract;
      this.profileHash = jsonContent.hash;
      this.profileSignature = jsonContent.signature;
    } catch (e) {
      alert("Invalid profile JSON!");
      return;
    }

    const signer_profile = generateSignerProfile(
      this.formValues.KYCContractAddress,
      this.formValues.KYCContractChainID,
      this.formValues
    );

    if (hashTypedData(signer_profile) != this.profileHash) {
      alert("Invalid profile HASH!");
      return;
    }

    const signerAddress = recoverSignature(
      this.profileHash,
      this.profileSignature
    );

    if (this.formValues.ethereumAddress != signerAddress) {
      alert("Invalid profile Signature!");
      return;
    }

    this.validProfile = true;
  }

  async sign() {
    this.validSignature = false;

    const ethereum: any = await detectEthereumProvider();
    if (!ethereum) {
      alert("Please install MetaMask or use a web3 browser!");
      return;
    }

    const accounts = await ethereum.request({ method: "eth_requestAccounts" });

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

    this.KYCSignature = signature;

    // check
    const signerAddress = recoverSignature(this.profileHash, this.KYCSignature);

    if (accounts[0] != signerAddress) {
      alert(
        `Something is worng with the signature. :( The recovered address is ${signerAddress} and your address is ${accounts[0]}`
      );
      return;
    }

    this.validSignature = true;
  }

  async writeToBlockchain() {
    const ethereum: any = await detectEthereumProvider();
    const provider = new BrowserProvider(ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();

    const abi = [
      "function registerProfile(address profileOwner, bytes32 hash, bytes calldata profileSignature, bytes calldata validatorSignature)",
      "function getProfileHashOf(address profileOwner) view returns (bytes32)",
    ];

    const kyc_contract = new Contract(
      this.formValues.KYCContractAddress,
      abi,
      signer
    );

    try {
      await kyc_contract.registerProfile(
        this.formValues.ethereumAddress,
        this.profileHash,
        this.profileSignature,
        this.KYCSignature
      );

      const hash = await kyc_contract.getProfileHashOf(
        this.formValues.ethereumAddress
      );

      if (hash == this.profileHash) {
        alert("Profile is successfully written to blockchain!");
      }
    } catch (e) {
      alert(e.reason);
    }
  }
}

export default toNative(KYCValidator);
</script>

<style>
.p-button-label {
  margin-left: 5px;
}
</style>