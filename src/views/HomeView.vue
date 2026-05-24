<script setup lang="ts">
import Toolbar from '@/components/Toolbar.vue'
import FurniturePanel from '@/components/FurniturePanel.vue'
import RoomCanvas from '@/components/RoomCanvas.vue'
import PropertiesPanel from '@/components/PropertiesPanel.vue'
</script>

<template>
  <div class="flex flex-col h-full">
    <Toolbar class="flex-shrink-0" />
    <div class="flex flex-1 overflow-hidden">
      <FurniturePanel class="w-64 flex-shrink-0 overflow-y-auto" />
      <RoomCanvas class="flex-1 overflow-auto" />
      <PropertiesPanel class="w-64 flex-shrink-0 overflow-y-auto" />
    </div>
  </div>
</template>
