<template>
  <div>
    <el-table-v2 :columns="columns" :data="data" :width="700" :height="400" fixed></el-table-v2>
  </div>
</template>

<script lang="tsx" setup>
/// <reference path="../../../shims-vue.d.ts" />
import { ref } from "vue"
import type { VNode } from "vue"
import dayjs from "dayjs"
import ElButton from "element-plus/es/components/button"
import ElIcon from "element-plus/es/components/icon"
import ElTag from "element-plus/es/components/tag"
import ElTooltip from "element-plus/es/components/tooltip"
import { TableV2FixedDir } from "element-plus/es/components/table-v2/src/constants"
import type { Column } from "element-plus/es/components/table-v2/src/types"
import { Timer } from "@element-plus/icons-vue"

let id = 0

const dataGenerator = () => ({
  id: `random-id-${++id}`,
  name: "Tom",
  date: "2020-10-1",
})

const columns: Column<any>[] = [
  {
    key: "date",
    title: "Date",
    dataKey: "date",
    width: 150,
    fixed: TableV2FixedDir.LEFT,
    cellRenderer: ({ cellData: date }) =>
      (
        <ElTooltip content={dayjs(date).format("YYYY/MM/DD") as string}>
          <span class="flex items-center">
            <ElIcon class="mr-3">
              <Timer />
            </ElIcon>
            {dayjs(date).format("YYYY/MM/DD")}
          </span>
        </ElTooltip>
      ) as VNode,
  },
  {
    key: "name",
    title: "Name",
    dataKey: "name",
    width: 150,
    align: "center",
    cellRenderer: ({ cellData: name }: { cellData: string }) => (<ElTag>{name}</ElTag>) as VNode,
  },
  {
    key: "operations",
    title: "Operations",
    cellRenderer: () =>
      (
        <>
          {/* <ElButton size="small" v-auth="edit">Edit</ElButton> */}
          <ElButton size="small">Edit</ElButton>
          {/* <ElButton size="small" type="danger" v-auth="delete">Delete</ElButton> */}
          <ElButton size="small" type="danger">
            Delete
          </ElButton>
        </>
      ) as VNode,
    width: 150,
    align: "center",
  },
]

const data = ref(Array.from({ length: 8 }).map(dataGenerator))
</script>
