<script>
  import root_node from "./files.json";

  let current_nodes;

  (() => {
    // '/base/' or '/base/asd/asd' or '/base/asd/asd/'
    const pathname = new URL(window.location.href).pathname;
    // '' or 'asd/asd' or 'asd/asd/'
    const nobase_path = pathname.slice(pathname.indexOf(import.meta.env.BASE_URL) + import.meta.env.BASE_URL.length);
    // [''] or ['asd', 'asd'] or ['asd', 'asd', '']
    const path = nobase_path.split("/");
    const isFolder = path[path.length - 1] === "";
    const first_path = {
      isFolder,
      path: path.slice(0, path.length + (isFolder ? -1 : 0)),
    };

    current_nodes = [root_node];
    if (first_path.path.length === 0) return;

    /**@type {any}*/
    let current = root_node;
    // 注意 length - 1
    for (let i = 0; i < first_path.path.length - 1; i += 1) {
      current = current.children.find((child) => child.name === first_path.path[i] && child.isFolder);
      // 找到了这个文件夹
      if (current) {
        current_nodes.push(current);
      } else {
        current_nodes = null;
        return;
      }
    }

    // 最终名字和类型都匹配
    current = current.children.find((child) => child.name === first_path.path[first_path.path.length - 1] && child.isFolder === first_path.isFolder);
    if (current) {
      current_nodes.push(current);
    } else {
      current_nodes = null;
      return;
    }

    current_nodes = current_nodes;
  })();

  function forward(/** @type string */ destination, isFolder) {
    const current = current_nodes[current_nodes.length - 1].children.find((child) => child.name === destination && child.isFolder === isFolder);
    if (current) {
      current_nodes.push(current);
    } else {
      current_nodes = null;
      return;
    }

    current_nodes = current_nodes;
    history.replaceState(
      null,
      "",
      import.meta.env.BASE_URL +
        current_nodes
          .slice(1)
          .map((node) => node.name)
          .join("/") +
        (current_nodes[current_nodes.length - 1].isFolder && current_nodes.length > 1 ? "/" : "")
    );
  }

  function back(/** @type number */ times = 1) {
    if (times > 0) {
      current_nodes = current_nodes.slice(0, current_nodes.length - times);
      history.replaceState(
        null,
        "",
        import.meta.env.BASE_URL +
          current_nodes
            .slice(1)
            .map((node) => node.name)
            .join("/") +
          (current_nodes[current_nodes.length - 1].isFolder && current_nodes.length > 1 ? "/" : "")
      );
    }
  }

  function formatBytes(/** @type number */ bytes, /** @type number */ decimals) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals || 2;
    const sizes = ["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
  }
</script>

<div class="flex flex-col container mx-auto min-h-screen py-4">
  <div class="text-4xl px-4">
    <h1>Cosmoe</h1>
  </div>

  {#if current_nodes}
    <div class="mt-4 pb-2 text-gray-500 text-[0px] px-4">
      {#each current_nodes as node, i (node.name + i)}
        {#if i !== 0}
          <span class="text-base mx-2">/</span>
        {/if}
        <button
          on:click={() => {
            back(current_nodes.length - 1 - i);
          }}
          type="button"
          class="text-base hover:underline {current_nodes.length - 1 === i ? 'text-black' : ''} text-ellipsis max-w-full whitespace-nowrap overflow-hidden">{node.name}</button
        >
      {/each}
    </div>
  {/if}

  <div class="flex flex-col">
    {#if current_nodes}
      {#if current_nodes[current_nodes.length - 1].isFolder}
        {#each current_nodes[current_nodes.length - 1].children as child (child.name + current_nodes.length)}
          <button
            type="button"
            on:click={() => {
              forward(child.name, child.isFolder);
            }}
            class=" text-left hover:bg-gray-100 px-4 py-2 flex gap-4 items-center"
          >
            {#if child.isFolder}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 text-blue-300">
                <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
              </svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-blue-300">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            {/if}

            <div>
              <div>{child.name}</div>
              <div class="text-xs text-gray-500">{child.isFolder ? "文件夹" : formatBytes(parseInt(child.content.Size, 10))}</div>
            </div>
          </button>
        {/each}
      {:else}
        <div class="flex flex-col gap-2 px-4">
          <a href="{root_node.url}/{current_nodes[current_nodes.length - 1].content.Key}" class="text-blue-600 underline hover:decoration-inherit decoration-blue-300 text-2xl w-fit text-ellipsis max-w-full whitespace-nowrap overflow-hidden">{current_nodes[current_nodes.length - 1].name}</a>
          <p class="text-sm border border-gray-400 rounded-full px-3 py-1 w-fit text-ellipsis max-w-full whitespace-nowrap text-gray-800 overflow-hidden">储存: {current_nodes[current_nodes.length - 1].content.StorageClass}</p>
          <p class="text-sm border border-gray-400 rounded-full px-3 py-1 w-fit text-ellipsis max-w-full whitespace-nowrap text-gray-800 overflow-hidden">大小: {current_nodes[current_nodes.length - 1].content.Size} Bytes</p>
          <p class="text-sm border border-gray-400 rounded-full px-3 py-1 w-fit text-ellipsis max-w-full whitespace-nowrap text-gray-800 overflow-hidden">上次修改时间: {current_nodes[current_nodes.length - 1].content.LastModified}</p>
          <p class="text-sm border border-gray-400 rounded-full px-3 py-1 w-fit text-ellipsis max-w-full whitespace-nowrap text-gray-800 overflow-hidden">ETag: {current_nodes[current_nodes.length - 1].content.ETag}</p>
          <p class="text-sm border border-gray-400 rounded-full px-3 py-1 w-fit text-ellipsis max-w-full whitespace-nowrap text-gray-800 overflow-hidden">文件直链: {root_node.url}/{current_nodes[current_nodes.length - 1].content.Key}</p>
        </div>
      {/if}
    {:else}
      <div>
        <div class="text-xl p-4">找不到</div>
      </div>
    {/if}
  </div>
</div>
