import COS from "cos-nodejs-sdk-v5";
import { writeFile } from "node:fs";

function Key(/**@type string*/ key) {
  this.key = key;
  this.isFolder = key[key.length - 1] === "/";
  this.segments = key[key.length - 1] === "/" ? key.slice(0, key.length - 1).split("/") : key.split("/");
}

/**
 * @param {string} id
 * @param {string} key
 * @param {string} bucket
 * @param {string} region
 * @param {string} prefix
 */
export function getContents(id, key, bucket, region, prefix) {
  const cos = new COS({
    SecretId: id,
    SecretKey: key,
  });

  return new Promise((resolve, reject) => {
    cos.getBucket(
      {
        Bucket: bucket,
        Region: region,
        Prefix: prefix,
      },
      (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(data.Contents);
        return;
      }
    );
  });
}

/**
 * @param {COS.CosObject[]} contents
 * @param {string} url
 * @param {boolean} sort
 */
export function getNested(contents, url, sort = false) {
  if (sort) {
    contents.sort((a, b) => {
      if (a.Key[a.Key.length - 1] === "/" && b.Key[b.Key.length - 1] !== "/") {
        return -1;
      } else if (b.Key[b.Key.length - 1] === "/" && a.Key[a.Key.length - 1] !== "/") {
        return 1;
      } else {
        return a.Key.localeCompare(b.Key, "zh");
      }
    });
  }

  const root = {
    url,
    name: "root",
    isFolder: true,
    children: [],
  };
  let parent = root;
  for (const content of contents) {
    const key = new Key(content.Key);
    const segments = key.segments;
    for (const segment of segments.slice(0, segments.length - 1)) {
      let newparent = parent.children.find((child) => segment === child.name);
      if (newparent === undefined) {
        newparent = {
          name: segment,
          isFolder: true,
          children: [],
        };
        parent.children.push(newparent);
      }
      parent = newparent;
    }
    parent.children.push(
      key.isFolder
        ? {
            name: segments[segments.length - 1],
            isFolder: true,
            children: [],
          }
        : {
            name: segments[segments.length - 1],
            isFolder: false,
            children: [],
            content: {
              ...content,
              Owner: {
                ...content.Owner,
              },
            },
          }
    );
    parent = root;
  }
  return root;
}

/**
 * @param {string} id
 * @param {string} key
 * @param {string} bucket
 * @param {string} region
 * @param {string} prefix
 * @param {string} file
 * @param {string} url
 */
export function writeNested(id, key, bucket, region, prefix, file, url) {
  getContents(id, key, bucket, region, prefix).then((contents) => {
    const data = JSON.stringify(getNested(contents, url, true));

    writeFile(file, data, (err) => {
      if (err) throw err;

      console.log("genfiles 成功");
    });
  });
}

// COS_URL 为页面文件直链的链接前部分如 https://example.com
if (!(process.env.COS_ID && process.env.COS_KEY && process.env.COS_BUCKET && process.env.COS_REGION && process.env.COS_PREFIX && process.env.COS_URL)) {
  console.log("请设置环境变量COS_ID, COS_KEY, COS_BUCKET, COS_REGION, COS_PREFIX, COS_URL");
}
writeNested(process.env.COS_ID, process.env.COS_KEY, process.env.COS_BUCKET, process.env.COS_REGION, process.env.COS_PREFIX, "src/files.json", process.env.COS_URL);
