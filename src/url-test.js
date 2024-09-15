const imgUrl =
  "ipfs://ipfs/bafybeieqevvelxilr2wdysmsngodomluqqmjcmzt24hufycd3ebfn4haoi/image.png";

const urlObj = new URL(imgUrl);

const resultUrl = `https://ipfs.io/ipfs${urlObj.pathname}`;
console.log(resultUrl);
