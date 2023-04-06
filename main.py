# Libraries
import aubio
import numpy as np
import msgpack
# import RPi.GPIO as GPIO
import os
import time
import socket
import threading
from random import *
# import busio
# import digitalio
# import board
# import adafruit_mcp3xxx.mcp3008 as MCP
# from adafruit_mcp3xxx.analog_in import AnalogIn
from statistics import mean, median
import pyaudio


# Logging in order to send voltage debugging info into a file - in order to visualize remap range
import logging
logger = logging.Logger("voltages", logging.DEBUG)
# fmt = logging.Formatter(format='%(asctime)s %(message)s')
logger.addHandler(logging.FileHandler(
    os.path.join(os.getcwd(), "volategs.log"), mode='w+'))

# GPIO Mode (BOARD / BCM)
# GPIO.setmode(GPIO.BCM)

# set GPIO Pins
pin23 = 23  # GPIO23 on the Pi
pin24 = 24  # GPIO24 on the Pi
pin25 = 25  # GPIO25 on the Pi
pin26 = 26  # GPIO26 on the Pi

# # set GPIO direction (IN / OUT)
# GPIO.setup(pin23, GPIO.IN)
# GPIO.setup(pin24, GPIO.IN)
# GPIO.setup(pin25, GPIO.IN)
# GPIO.setup(pin26, GPIO.IN)

# # create the spi bus
# spi = busio.SPI(clock=board.SCK, MISO=board.MISO, MOSI=board.MOSI)

# # create the cs (chip select)
# cs = digitalio.DigitalInOut(board.D22)

# # create the mcp object
# mcp = MCP.MCP3008(spi, cs)

# # create an analog input channel on pin 0, 1 and 2
# chan0 = AnalogIn(mcp, MCP.P0)
# chan1 = AnalogIn(mcp, MCP.P1)
# chan2 = AnalogIn(mcp, MCP.P2)


def remap_range(value, left_min, left_max, right_min, right_max):
    # this remaps a value from original (left) range to new (right) range
    # Figure out how 'wide' each range is
    left_span = left_max - left_min
    right_span = right_max - right_min

    # set the value to right_min if it is below left_min
    if (value <= left_min):
        return right_min
    elif (value >= left_max):
        return right_max

    # Convert the left range into a 0-1 range (int)
    valueScaled = (value - left_min) / (left_span)

    # Convert the 0-1 range into a value in the right range.
    return int(right_min + (valueScaled * right_span))


def dataSend():
    HOST = "127.0.0.1"  # "192.168.2.1"
    PORT = 9000

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect((HOST, PORT))  # connect to server
        x = 0
        y = 0
        while True:
            # read the analog pins
            # OPTIOINAL: Average all readings
            # vArr = []
            # for i in range(10):
            #     trim_pot0 = chan0.voltage
            #     vArr.append(trim_pot0)
            # trim_pot0 = mean(vArr)

            # trim_pot0 = chan0.voltage
            # trim_pot1 = chan1.voltage
            # trim_pot2 = chan2.voltage

            # # convert 16bit adc0 (0-65535) trim pot read into 0-100 volume level
            # set_value_chan0 = remap_range(trim_pot0, 2.10, 2.80, 255, 0)
            # set_value_chan1 = remap_range(trim_pot1, 2.10, 2.50, 255, 0)
            # set_value_chan2 = remap_range(trim_pot2, 2.10, 3.00, 255, 0)

            r = randint(0, 255)  # set_value_chan0  # set_value_chan0
            g = randint(0, 255)  # set_value_chan1  # set_value_chan1
            b = randint(0, 255)  # set_value_chan2  # set_value_chan2
            # logger.info(f"{time.time_ns()},{chan0.voltage},{chan1.voltage},{chan2.voltage}")

            # generate random number to represent x coordinate of particle  r/255 * 1500 + randint(0,100)/20
            x = randint(0, 2000)
            # generate random number to represent y coordinate of particle
            y = randint(0, 900)

            # assign pin inputs to their respective button readings
            pausePlayButton = 1  # GPIO.input(pin23)
            clearButton = 1  # GPIO.input(pin24)
            screenshotButton = 1  # GPIO.input(pin25)
            currentView = 0  # GPIO.input(pin26)
            musicData = []

            if currentView == 0:
                # User has switched to feedback mode --> start recording music
                # for 32 bit use this. for 16 bit use FORMAT = pyaudio.paInt16
                FORMAT = pyaudio.paFloat32

                CHANNELS = 1
                RATE = 44100  # sampling rate (samples/s)
                CHUNK = 1024
                PITCH_THRESHOLD = 0.2  # ignore frequencies < 80khz
                BUFFER_SIZE = CHUNK // 2

                audio = pyaudio.PyAudio()

                # Open input stream from audio input device zero (default)
                stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE,
                                    input=True, frames_per_buffer=CHUNK, input_device_index=0)

                # Set up pitch detection object
                # BUFFER_SIZE, CHUNK, RATE)
                pitch_detector = aubio.pitch("default", 4096, 1024, 44100)
                pitch_detector.set_unit("Hz")
                pitch_detector.set_silence(-40)

                # Set up beat detection object
                # BUFFER_SIZE, CHUNK, RATE)
                beat_detector = aubio.tempo("default", 4096, 1024, 44100)
                beat_detector.set_silence(-40)

                # Read audio data from stream
                data = stream.read(CHUNK, exception_on_overflow=False)
                samples = np.frombuffer(data, dtype=aubio.float_type)

                # scale samples to use them in renderer
                scaled_samples = (samples - np.min(samples)) / \
                    (np.max(samples) - np.min(samples)) * 255
                int_samples = scaled_samples.astype(np.uint8)
                int_samples = int_samples.tolist()

                # Perform pitch detection
                pitch = pitch_detector(samples)[0]

                # Perform beat detection
                #is_beat = beat_detector(samples)

                #print(type(int_samples))
                # print(type(is_beat))

                note = ""

                # Convert pitch to musical note and ignore silence or noise
                if pitch > PITCH_THRESHOLD:
                    note = aubio.freq2note(pitch)
                    print(
                        "Note: " + note + "   Pitch: " + str(pitch))

                pitch = pitch.tolist()
                musicData = [pitch, note, int_samples]

                someArr = [255, 255, 255, 0, 0, pausePlayButton,
                           clearButton, screenshotButton, currentView, musicData]
                bts = msgpack.packb(someArr)
                sock.sendall(bts)
                # time.sleep(0.03)
                continue

            # # discard and dont render rgb values that are white (handled in renderer)
            # if r >= 250 and g >= 250 and b >= 250:
            #     someArr = [255, 255, 255, 0, 0, pausePlayButton,
            #                clearButton, screenshotButton, currentView, musicData]
            #     bts = msgpack.packb(someArr)
            #     sock.sendall(bts)
            #     time.sleep(0.03)
            #     continue

            someArr = [r, g, b, x, y, pausePlayButton, clearButton,
                       screenshotButton, currentView, musicData]
            bts = msgpack.packb(someArr)
            sock.sendall(bts)
            time.sleep(0.03)  # delay in sending data on TCP socket
            # print('CH0: ', r)
            # print('Voltage: ', trim_pot0)
            # print('CH1: ', g)
            # print('Voltage: ', trim_pot1)
            # print('CH2: ', b)
            # print('Voltage: ', trim_pot2)
            # print('\n')


if __name__ == "__main__":
    print("Running...")

    p1 = threading.Thread(target=dataSend, daemon=True)
    p1.start()

    try:
        p1.join()
    except KeyboardInterrupt:
        # GPIO.cleanup()
        print("Exiting Python gracefully?")
