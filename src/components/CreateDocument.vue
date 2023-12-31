<template>
  <form>
    <div class="mb-3">
      <Accordion>
        <AccordionTab :header="signer.name" v-for="(signer, idx) in signers" :key="`signer_${idx}`">
          xxxx
        </AccordionTab>
      </Accordion>
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
  </form>
</template>

<script lang="ts">
import { Component, Vue, toNative } from "vue-facing-decorator";
import Accordion from "primevue/accordion";
import AccordionTab from "primevue/accordiontab";

@Component({
  components: {
    Accordion,
    AccordionTab,
  },
})
class CreateDocument extends Vue {
  signers = [{ name: "Laszlo Fazekas" }, { name: "Gabor Kiss" }];

  mounted() {
    let simplemde = new (window as any).SimpleMDE({
      element: this.$refs.document_editor,
    });
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
</style>