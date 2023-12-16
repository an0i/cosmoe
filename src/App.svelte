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
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 -960 960 960" class="w-8 h-8 text-blue-300">
                <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Z"/>
              </svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 -960 960 960" class="w-8 h-8 text-blue-300">
                <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520h200L520-800v200Z"/>
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
