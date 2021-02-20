let createCard = (type, value, typeOfCard, isImage) => {
  let img = document.createElement("img");
  img.setAttribute("src", type == "src" ? value : URL.createObjectURL(value));
  img.classList.add("img");

  let imgWrap = document.createElement("div");
  imgWrap.classList.add("imgContainer");

  if (type == "src") {
    let a = document.createElement("a");
    a.classList.add("steganoImage");
    a.setAttribute("href", value);
    a.setAttribute("download", value);
    imgWrap.append(a);
  }

  if (typeOfCard == "encode" && !isImage) {
    img.setAttribute("onload", "setTextLimit(this)");

    let msgInput = document.createElement("textArea");
    msgInput.classList.add("msg");
    msgInput.setAttribute("maxlength", 0);
    msgInput.setAttribute("type", "text");
    msgInput.setAttribute("onkeypress", "calc(this)");
    msgInput.setAttribute("placeholder", "Write your message here ...");

    let span = document.createElement("span");

    imgWrap.append(span);
    imgWrap.append(img);
    imgWrap.append(msgInput);
  } else {
    imgWrap.append(img);
  }

  return imgWrap;
};

let filesToBesteganographed = [];
let messageFromImageFiles = [];

const delay = (type, file) => {
  return new Promise((resolve, reject) => {
    setTimeout(
      (file) => {
        if (type === "src") {
          let result = document.querySelector(".result");
          let imgWrap = createCard(type, file);
          result.append(imgWrap);
          let img = document.querySelectorAll(".result .img");
          result.scrollTo(img.length * 200, 0);
        } else {
          let selectedImages;
          if (type == "decode") {
            selectedImages = document.querySelector(".decode .selectedImages");
          } else {
            selectedImages = document.querySelector(".encode .selectedImages");
          }
          let imgWrap = createCard("file", file, type);
          selectedImages.append(imgWrap);
          let img = selectedImages.querySelectorAll(".img");
          selectedImages.scrollTo(img.length * 200, 0);
        }
        resolve();
      },
      200,
      file
    );
  });
};

const handleChange = async (type, e, image = 0) => {
  let selectedImages;
  if (type == "decode") {
    selectedImages = document.querySelector(".decode .selectedImages");
    messageFromImageFiles.push(...e.target.files);
  } else {
    selectedImages = document.querySelector(".encode .selectedImages");
    filesToBesteganographed.push(...e.target.files);
  }
  let cursor = selectedImages.scrollLeft;
  for (let file of e.target.files) await delay(type, file);

  setTimeout(() => {
    selectedImages.scrollTo(0, 0);
    if (cursor) selectedImages.scrollTo(cursor, 0);
  }, 400);
};

const send = (type, e) => {
  if (
    (type == "encode" && !filesToBesteganographed.length) ||
    (type == "decode" && !messageFromImageFiles.length)
  ) {
    alert("No image is selected");
    return;
  }
  let loading = document.querySelector("#loading");
  loading.style.display = "flex";
  let formData = new FormData();

  if (type == "encode") {
    let messages = [];
    document
      .querySelectorAll(".selectedImages .msg")
      .forEach((msg) => messages.push(msg.value));

    formData.append("messages", messages);
    filesToBesteganographed.map((file) => {
      formData.append("files", file);
    });
  } else {
    messageFromImageFiles.map((file) => {
      formData.append("files", file);
    });
  }

  axios({
    method: "POST",
    url: type == "encode" ? "/steg-encode" : "/steg-decode",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }).then((URLs) => {
    let result;
    if (type == "decode") {
      result = document.querySelector(".decode .result");
    } else {
      result = document.querySelector(".encode .result");
    }
    while (result.lastChild) result.removeChild(result.lastChild);
    // if (type == "encode") {
    //     let downloadAll = document.querySelector('.download')
    //     if (downloadAll)
    //         document.querySelectorAll('.encode')[1].removeChild(downloadAll)
    //     let div = document.createElement("div")
    //     div.classList.add('download')
    //     div.setAttribute('onclick', 'downloadAll()')
    //     document.querySelectorAll(".encode")[1].prepend(div)
    // }
    URLs.data.map(async (value) => {
      if (type == "encode") {
        // let imgWrap = createCard("src", value)
        // result.append(imgWrap)
        let cursor = result.scrollLeft;
        await delay("src", value);
        setTimeout(() => {
          result.scrollTo(cursor, 0);
        }, 500);
      } else {
        let p = document.createElement("p");
        p.textContent = value;
        result.append(p);
      }
      loading.style.display = "none";
    });
  });
};

const setTextLimit = (ths) => {
  ths.parentElement.lastChild.maxLength =
    Math.floor((ths.naturalWidth * ths.naturalHeight * 4) / 7) - 2;
};

const calc = (ths) => {
  let totCharLeft = ths.maxLength - ths.value.length;
  ths.parentElement.children[0].textContent = totCharLeft;
};

downloadAll = () => {
  let images = document.querySelectorAll(".steganoImage");
  if (!images.length) {
    alert("No images to download");
    return;
  }
  images.forEach((image) => {
    image.click();
  });
};

route = (ths, page) => {
  filesToBesteganographed = [];
  let lists = document.querySelectorAll(".list");
  lists.forEach((ele) => {
    ele.classList.remove("active");
  });
  ths.classList.add("active");
  let mainContent = document.querySelector(".mainContent");
  mainContent.scrollTo(0, mainContent.clientHeight * page);
};
