# http://www.ee.surrey.ac.uk/CVSSP/demos/chars74k/
# https://www.tensorflow.org/js/guide/conversion


import matplotlib.pyplot as plt
import numpy as np
import os
import PIL
import tensorflow as tf
import pathlib

from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.models import Sequential

alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

def fix_training_data():
    import os
    folders = os.listdir('./training_data/BW')
    res = (28, 28)
    c = 0
    for folder in folders:
        files = os.listdir('./training_data/BW/' + folder)
        c2 = 0
        for file in files:
            img = PIL.Image.open('./training_data/BW/' + folder + '/' + file)
            max_dim = max(img.size)
            transformed = PIL.Image.new('L', (max_dim, max_dim), sum(img.getpixel((0, 0))) // 3)
            diff = img.size[0] - img.size[1]
            if diff > 0:
                transformed.paste(img, (0, diff // 2))
            else:
                transformed.paste(img, (-1 * diff // 2, 0))
            transformed = transformed.resize(res)
            if not os.path.exists('./new_training_data/BW/' + alphabet[c]):
                os.mkdir('./new_training_data/BW/' + alphabet[c])
            transformed.save('./new_training_data/BW/' + alphabet[c] + '/image_' + str(c2) + '.jpg')
            c2 += 1
        c += 1


def train():
    data_dir = pathlib.Path('new_training_data/BW')

    count = len(list((data_dir.glob('*/*.bmp'))))
    print(count)

    batch_size = 32
    img_height = 28
    img_width = 28

    train_ds = tf.keras.preprocessing.image_dataset_from_directory(
        data_dir,
        validation_split=0.2,
        subset="training",
        seed=777,
        image_size=(img_height, img_width),
        batch_size=batch_size,
        color_mode='grayscale'
    )

    val_ds = tf.keras.preprocessing.image_dataset_from_directory(
        data_dir,
        validation_split=0.2,
        subset="validation",
        seed=777,
        image_size=(img_height, img_width),
        batch_size=batch_size,
        color_mode='grayscale'
        )

    class_names = train_ds.class_names
    print(class_names)

    for image_batch, labels_batch in train_ds:
        print(image_batch.shape)
        print(labels_batch.shape)
        break

    AUTOTUNE = tf.data.AUTOTUNE

    train_ds = train_ds.cache().shuffle(1000).prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)
    normalization_layer = layers.experimental.preprocessing.Rescaling(1. / 255)
    normalize = tf.keras.layers.Rescaling(1./255)

    data_augmentation = keras.Sequential(
        [
            layers.experimental.preprocessing.RandomRotation(0.1, input_shape=(img_height, img_width, 1))
        ]
    )

    num_classes = 26

    # model = Sequential([
    #     # data_augmentation,
    #     # layers.experimental.preprocessing.Rescaling(1. / 255),
    #     layers.Conv2D(16, 3, padding='same', activation='relu'),
    #     layers.MaxPooling2D(),
    #     layers.Conv2D(32, 3, padding='same', activation='relu'),
    #     layers.MaxPooling2D(),
    #     # layers.Conv2D(64, 3, padding='same', activation='relu'),
    #     # layers.MaxPooling2D(),
    #     layers.Dropout(.2),
    #     layers.Flatten(),
    #     layers.Dense(128, activation='relu'),
    #     layers.Dense(num_classes)
    # ])
    model = Sequential([
        data_augmentation,
        # layers.experimental.preprocessing.Rescaling(1. / 255),
        layers.Conv2D(16, 5, padding='same', activation='relu'),
        layers.MaxPooling2D(),
        layers.Conv2D(32, 5, padding='same', activation='relu'),
        layers.MaxPooling2D(),
        layers.Conv2D(48, 5, padding='same', activation='relu'),
        layers.MaxPooling2D(),
        layers.Dropout(.3),
        layers.Flatten(),
        layers.Dense(64, activation='relu'),
        layers.Dense(num_classes)
    ])

    model.compile(optimizer='adam',
        loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
        metrics=['accuracy'])

    # model.summary()



    epochs = 100
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
    )

    name = "bw_no_rotate_smaller"
    try:
        model.save('saved_models/'+name+'.h5')
    except:
        os.mkdir('saved_models/'+name+'.h5')
        model.save('saved_models/'+name+'.h5')

    acc = history.history['accuracy']
    val_acc = history.history['val_accuracy']

    loss = history.history['loss']
    val_loss = history.history['val_loss']

    epochs_range = range(epochs)

    plt.figure(figsize=(8, 8))
    plt.subplot(1, 2, 1)
    plt.plot(epochs_range, acc, label='Training Accuracy')
    plt.plot(epochs_range, val_acc, label='Validation Accuracy')
    plt.legend(loc='lower right')
    plt.title('Training and Validation Accuracy')

    plt.subplot(1, 2, 2)
    plt.plot(epochs_range, loss, label='Training Loss')
    plt.plot(epochs_range, val_loss, label='Validation Loss')
    plt.legend(loc='upper right')
    plt.title('Training and Validation Loss')
    plt.show()


class Classifier:
    def __init__(self, modelpath):
        self.model = tf.keras.models.load_model(modelpath)

    def predict_files(self, images):
        img_arrays = [tf.expand_dims(keras.preprocessing.image.img_to_array(PIL.Image.open(img)), 0) for img in images]
        for i in img_arrays:
            data = self.model.predict(i)
            print(alphabet[np.argmax(data)], str(max(data) * 100) + '%')

    def predict_image(self, img):
        img_array = keras.preprocessing.image.img_to_array(img)
        # print (img_array)
        img_array = tf.expand_dims(img_array, 0)
        scores = self.model.predict(img_array)
        return alphabet[np.argmax(scores)], float(max(tf.nn.softmax(scores[0])))


def classify(filename):
    model = tf.keras.models.load_model('./saved_models/bw_10_no_rotate')
    img = PIL.Image.open(filename)
    img_array = keras.preprocessing.image.img_to_array(img)
    print(img_array.shape)
    img_array = tf.expand_dims(img_array, 0)  # Create a batch
    print(img_array.shape)
    predictions = model.predict(img_array)
    scores = tf.nn.softmax(predictions[0])
    return alphabet[np.argmax(scores)]

    print(score)
