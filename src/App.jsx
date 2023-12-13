import React, { useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { getStorage, ref, listAll, getDownloadURL, uploadBytes, deleteObject } from 'firebase/storage';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Footer from './components/Footer';
import Navbar from './components/Navbar';

const MySwal = withReactContent(Swal);

function App() {
  const firebaseConfig = {
  apiKey: "AIzaSyDS4HKpMu5k2NZg5cati42R2cUv3zWbPhM",
  authDomain: "bebeloves-cf261.firebaseapp.com",
  projectId: "bebeloves-cf261",
  storageBucket: "bebeloves-cf261.appspot.com",
  messagingSenderId: "38408540489",
  appId: "1:38408540489:web:c1001fe290853de83d0a98",
  measurementId: "G-ZVNBZE7KWR"
};

  firebase.initializeApp(firebaseConfig);

  const [imageUrls, setImageUrls] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const storage = getStorage();
    const imagesRef = ref(storage, 'img');

    listAll(imagesRef)
      .then((res) => {
        const promises = res.items.map((item) =>
          getDownloadURL(item).then((url) => url)
        );
        Promise.all(promises).then((urls) => {
          setImageUrls(urls);
        });
      })
      .catch((error) => {
        console.log('Error fetching images:', error);
      });
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      const storage = getStorage();
      const storageRef = ref(storage, `img/${file.name}`);

      setUploading(true);

      uploadBytes(storageRef, file)
        .then((snapshot) => {
          console.log('Image uploaded successfully');
          getDownloadURL(snapshot.ref)
            .then((url) => {
              setImageUrls((prevUrls) => [...prevUrls, url]);
              setUploading(false);
            })
            .catch((error) => {
              console.log('Error getting download URL:', error);
              setUploading(false);
            });
        })
        .catch((error) => {
          console.log('Error uploading image:', error);
          setUploading(false);
        });
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    showImageDialog(imageUrl);
  };

  const showImageDialog = (imageUrl) => {
    MySwal.fire({
      html: `
        <div class="image-preview-container rounded">
          <img class="rounded-5" src="${imageUrl}" alt="Image Preview" width="230" height="300" />
          <div class="image-buttons"><br>
            <button class="btn btn-danger" id="delete-button">
              Delete
            </button>
            <button class="btn btn-primary" id="update-button">
              Update
            </button>
          </div>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      focusConfirm: false,
      customClass: {
        container: 'swal-image-preview',
      },
      buttonsStyling: false,
      showClass: {
        popup: 'swal2-show',
      },
      hideClass: {
        popup: 'swal2-hide',
      },
      didOpen: () => {
        const deleteButton = document.getElementById('delete-button');
        const updateButton = document.getElementById('update-button');

        deleteButton.addEventListener('click', () => handleImageDelete(imageUrl));
        updateButton.addEventListener('click', () => handleImageUpdate(imageUrl));

        MySwal.getPopup().classList.add('swal-image-preview');
      },
      willClose: () => {
        const deleteButton = document.getElementById('delete-button');
        const updateButton = document.getElementById('update-button');

        deleteButton.removeEventListener('click', () => handleImageDelete(imageUrl));
        updateButton.removeEventListener('click', () => handleImageUpdate(imageUrl));
      },
    });
  };

  const handleImageDelete = (imageUrl) => {
    MySwal.fire({
      title: 'Are you sure?',
      text: 'This action is irreversible!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const storage = getStorage();
        const imageRef = ref(storage, `img/${getImageFileName(imageUrl)}`);

        deleteObject(imageRef)
          .then(() => {
            console.log('Image deleted successfully');
            removeImageFromWebsite(imageUrl); // Remove the image from your website
            setImageUrls((prevUrls) => prevUrls.filter((url) => url !== imageUrl));
            setSelectedImage(null);
            Swal.fire('Deleted!', 'Image has been deleted successfully.', 'success');
          })
          .catch((error) => {
            console.log('Error deleting image:', error);
            Swal.fire('Error', 'Failed to delete the image.', 'error');
          });
      }
    });
  };

  const handleImageUpdate = (imageUrl) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];

      if (file) {
        const storage = getStorage();
        const storageRef = ref(storage, `img/${file.name}`);

        setUploading(true);

        uploadBytes(storageRef, file)
          .then((snapshot) => {
            console.log('Image updated successfully');
            getDownloadURL(snapshot.ref)
              .then((url) => {
                setImageUrls((prevUrls) =>
                  prevUrls.map((prevUrl) => (prevUrl === imageUrl ? url : prevUrl))
                );
                setSelectedImage(url);
                setUploading(false);
                Swal.fire('Updated!', 'Image has been updated successfully.', 'success');
              })
              .catch((error) => {
                console.log('Error getting download URL:', error);
                setUploading(false);
                Swal.fire('Error', 'Failed to get the updated image URL.', 'error');
              });
          })
          .catch((error) => {
            console.log('Error updating image:', error);
            setUploading(false);
            Swal.fire('Error', 'Failed to update the image.', 'error');
          });
      }
    });

    fileInput.click();
  };

  const getImageFileName = (imageUrl) => {
    const urlParts = imageUrl.split('/');
    return urlParts[urlParts.length - 1];
  };

  const removeImageFromWebsite = (imageUrl) => {
    // Remove the image from the website (assuming you have a DOM element representing the image)
    const imageElements = document.querySelectorAll(`img[src="${imageUrls}"]`);
    imageElements.forEach((imageElement) => {
      imageElement.parentNode.removeChild(imageElement);
    });
  };

  return (
    <>
    <section id="hidden">
    <Navbar />
      <div className="container bos">
        <div className="row">
          {imageUrls.map((imageUrl, index) => (
            <div className="col-12 col-md-3 col-lg-3" key={index}>
              <div className="image-container text-center">
                <img
                  className="rounded my-4"
                  src={imageUrl}
                  alt={`Image ${index}`}
                  width="300"
                  height="350"
                  onClick={() => handleImageClick(imageUrl)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className='boxUpload text-end me-3 '>
      <label htmlFor="upload-image" className="btn btn-dark haha">
        <input
          id="upload-image"
          type="file"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
        <span className="upload-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M10 16h4V7h3l-5-5-5 5h3zm-1.63-6.29L12 4.04l3.63 3.63-1.41 1.41L12 6.86 8.79 10.07z" />
          </svg>
        </span>
      </label>
      </div>
     
      
      <Footer />
    </section>
      
    </>
  );
}

export default App;
