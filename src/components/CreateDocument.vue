<template>
  <form>
    <div class="mb-3">
      <p v-if="signers.length == 0">Choose one or more signer profiles.</p>
      <Accordion>
        <AccordionTab v-for="(signer, idx) in signers" :key="`signer_${idx}`">
          <template #header>
            <div class="accordion-header-content">
              {{ signer.profile.message.name }}
              <button class="trash-button" @click="deleteSigner(idx)">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </template>
          <div class="mb-3" v-for="field in fields" :key="field.name">
            <label :for="field.name" class="form-label">{{
              field.label
            }}</label>
            <input
              type="text"
              class="form-control"
              :id="field.name"
              :value="getProfileData(signer, field.name)"
              readonly
              disabled
            />
          </div>
        </AccordionTab>
      </Accordion>
    </div>
    <div class="mb-3" style="display: flex">
      <FileUpload
        mode="basic"
        chooseLabel="Choose profile JSON"
        uploadLabel="Upload"
        accept=".json"
        :class="['btn', 'btn-success']"
        :auto="true"
        :customUpload="true"
        @uploader="profileUpload"
      />
    </div>
    <div class="mb-3">
      <label for="document-editor" class="form-label">
        Document (in Markdown format)
      </label>
      <textarea
        id="document-editor"
        class="form-control"
        rows="3"
        ref="document_editor"
      ></textarea>
    </div>
    <div class="mb-3" style="display: flex">
      <button
        type="button"
        class="btn btn-success"
        style="font-weight: 700"
        @click="saveToJSON"
      >
        Save to JSON
      </button>
      <FileUpload
        mode="basic"
        chooseLabel="Load from JSON"
        uploadLabel="Upload"
        accept=".json"
        :class="['btn', 'btn-success', 'ms-1']"
        :auto="true"
        :customUpload="true"
        @uploader="loadFromJSON"
      />
    </div>
  </form>
</template>

<script lang="ts">
import { Component, Vue, toNative } from "vue-facing-decorator";
import Accordion from "primevue/accordion";
import AccordionTab from "primevue/accordiontab";
import FileUpload from "primevue/fileupload";
import { readFileAsJSON, saveJSONAsFile } from "../utils/json_file_utils";
import { signer_profile_fields } from "../utils/signer_profile_utils";

@Component({
  components: {
    Accordion,
    AccordionTab,
    FileUpload,
  },
})
class CreateDocument extends Vue {
  fields = signer_profile_fields;
  signers = [];
  simplemde: any;

  mounted() {
    this.simplemde = new (window as any).SimpleMDE({
      element: this.$refs.document_editor,
      toolbar: [
        "bold",
        "italic",
        "heading",
        "|",
        "quote",
        "unordered-list",
        "ordered-list",
        "|",
        "preview",
        "side-by-side",
        "fullscreen",
        "|",
        "guide",
      ],
      autosave: {
        enabled: true,
        uniqueId: "opendocsign",
        delay: 10000,
      },
    });
  }

  async profileUpload(event) {
    try {
      const jsonContent = await readFileAsJSON(event.files[0]);
      this.signers.push(jsonContent);
    } catch (e) {
      alert("Invalid profile JSON!");
      return;
    }
  }

  deleteSigner(idx) {
    if (confirm("Are you sure you want to delete this signer?")) {
      this.signers.splice(idx, 1);
    }
  }

  saveToJSON() {
    saveJSONAsFile(
      {
        signers: this.signers,
        document: this.simplemde.value(),
      },
      "document.json"
    );
  }

  async loadFromJSON(event) {
    try {
      const jsonContent = await readFileAsJSON(event.files[0]);
      this.signers = jsonContent.signers;
      this.simplemde.value(jsonContent.document);
    } catch (e) {
      alert("Invalid document JSON!");
      return;
    }
  }

  getProfileData(signer, name) {
    if (name == "KYCContractChainID") return signer.profile.domain.chainId;
    if (name == "KYCContractAddress")
      return signer.profile.domain.verifyingContract;
    return signer.profile.message[name];
  }
}

export default toNative(CreateDocument);
</script>

<style>
.p-accordion .p-accordion-header .p-accordion-header-link {
  color: #000;
  background-color: #fff;
  text-decoration: none;
  font-weight: 400;
}

.accordion-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.trash-button {
  background: none;
  border: none;
  cursor: pointer;
}
</style>