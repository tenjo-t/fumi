<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Toolbar from "./components/Toolbar.vue";
import Sidebar from "./components/Sidebar.vue";
import NewFileDialog from "./components/NewFileDialog.vue";
import ContentArea from "./components/ContentArea.vue";

const files = ref<string[]>([]);
const currentFile = ref<string | null>(null);
const content = ref("");
const saved = ref(true);
const currentTab = ref<"editor" | "preview">("editor");
const previewSrc = ref("about:blank");

const newDialog = ref<InstanceType<typeof NewFileDialog> | null>(null);

const SIDEBAR_WIDTH_KEY = "fumi:sidebar-width";
const MIN_SIDEBAR_WIDTH = 120;
const MAX_SIDEBAR_WIDTH = 600;
const sidebarWidth = ref(parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY) ?? "220", 10));

function startResize(e: MouseEvent) {
  e.preventDefault();
  const startX = e.clientX;
  const startWidth = sidebarWidth.value;

  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";

  function onMouseMove(e: MouseEvent) {
    sidebarWidth.value = Math.min(
      MAX_SIDEBAR_WIDTH,
      Math.max(MIN_SIDEBAR_WIDTH, startWidth + e.clientX - startX),
    );
  }

  function onMouseUp() {
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth.value));
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

async function loadFiles() {
  const res = await fetch("/__fumi/api/files");
  files.value = await res.json();
}

async function openFile(path: string | null) {
  currentFile.value = path;
  if (path == null) {
    content.value = "";
    saved.value = true;
  } else {
    const res = await fetch("/__fumi/api/file?path=" + encodeURIComponent(path));
    content.value = await res.text();
    saved.value = true;
  }
}

async function saveFile() {
  if (!currentFile.value) return;
  await fetch("/__fumi/api/file?path=" + encodeURIComponent(currentFile.value), {
    method: "PUT",
    body: content.value,
  });
  saved.value = true;
}

function filePathToPageUrl(path: string): string {
  const url = "/" + path.replace(/\.md$/, "").replace(/\/index$/, "");
  return url === "/" ? "/" : url || "/";
}

function updatePreview() {
  if (!currentFile.value) return;
  previewSrc.value = filePathToPageUrl(currentFile.value);
}

function switchTab(tab: "editor" | "preview") {
  currentTab.value = tab;
  if (tab === "preview") updatePreview();
}

function goto(path: string | null) {
  openFile(path).then(() => {
    if (currentTab.value === "preview") updatePreview();
  });
}

async function createFile(path: string) {
  const today = new Date().toISOString().slice(0, 10);
  const title = path.split("/").pop()!.replace(/\.md$/, "");
  const template = `---\ntitle: ${title}\ndate: ${today}\n---\n\n# ${title}\n`;
  const res = await fetch("/__fumi/api/file?path=" + encodeURIComponent(path), {
    method: "POST",
    body: template,
  });
  if (res.status === 409) {
    alert("そのファイルは既に存在します");
    return;
  }
  newDialog.value?.close();
  await loadFiles();
  goto(path);
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    saveFile();
  }
}

onMounted(async () => {
  document.addEventListener("keydown", handleKeydown);
  await loadFiles();
  goto(new URL(location.href).searchParams.get("path"));

  (window as any).navigation?.addEventListener("navigate", (e: any) => {
    if (!e.canIntercept || e.hashChange || e.downloadRequest !== null) return;
    const url = new URL(e.destination.url);
    if (url.origin !== location.origin) return;
    if (!url.pathname.startsWith("/__fumi/editor")) return;
    e.intercept({
      async handler() {
        goto(url.searchParams.get("path"));
      },
    });
  });
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <Toolbar
    :current-file="currentFile"
    :current-tab="currentTab"
    :preview-src="previewSrc"
    :saved="saved"
    :sidebar-width="sidebarWidth"
    @switch-tab="switchTab"
    @save="saveFile"
  />
  <div class="relative flex flex-1 overflow-hidden">
    <Sidebar
      :files="files"
      :current-file="currentFile"
      :style="{ width: `${sidebarWidth}px` }"
      @open-new-dialog="newDialog?.open()"
    />
    <div
      class="absolute w-1 h-full shrink-0 cursor-col-resize hover:bg-teal-600 transition-colors"
      :style="{ left: `${sidebarWidth}px` }"
      @mousedown="startResize"
    />
    <NewFileDialog ref="newDialog" @create="createFile" />
    <ContentArea
      :content="content"
      :current-file="currentFile"
      :current-tab="currentTab"
      :preview-src="previewSrc"
      @update:content="content = $event"
      @dirty="saved = false"
    />
  </div>
</template>
