export function getCloudflareIPFSUrl(url: string) {
  let cid = "";

  if (url.indexOf("ipfs://") !== -1) {
    // Handle the case "ipfs://{cid}" or "ipfs://{cid}/additionalPath"
    cid = url.split("ipfs://")[1];
  } else if (url.indexOf("ipfs.io/ipfs/") !== -1) {
    // Handle the case "ipfs.io/ipfs/{cid}" or "ipfs.io/ipfs/{cid}/additionalPath"
    cid = url.split("ipfs.io/ipfs/")[1];
  }

  // Assuming the CID (and any additional path) extraction was successful
  if (cid) {
    return `https://cloudflare-ipfs.com/ipfs/${cid}`;
  } else {
    return url;
  }
}
