# Libraries
import msgpack
import RPi.GPIO as GPIO
import os
import time
import socket
import threading
from random import *
import busio
import digitalio
import board
import adafruit_ads1x15.ads1015 as ADS
from adafruit_ads1x15.analog_in import AnalogIn
import math

# Logging in order to send voltage debugging info into a file - in order to visualize remap range
import logging
logger = logging.Logger("voltages", logging.DEBUG)
# fmt = logging.Formatter(format='%(asctime)s %(message)s')
logger.addHandler(logging.FileHandler(os.path.join(os.getcwd(), "volategs.log"), mode='w+'))

# GPIO Mode (BOARD / BCM)
GPIO.setmode(GPIO.BCM)

# set GPIO Pins
pinA = 17 # GPIO17 on the Pi
pinB = 22 # GPIO22 on the Pi
pinC = 23 # GPIO23 on the Pi
pinD = 24 # GPIO24 on the Pi
pinE = 27 # GPIO27 on the Pi

# set GPIO direction (IN / OUT)
GPIO.setup(pinA, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
GPIO.setup(pinB, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
GPIO.setup(pinC, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(pinD, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
GPIO.setup(pinE, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

# create the I2C bus
i2c = busio.I2C(board.SCL, board.SDA)

# create the ADS object
ads = ADS.ADS1015(i2c)

# create an analog input channel on pins 0, 1, 2 and 3
chan0 = AnalogIn(ads, ADS.P0)
chan1 = AnalogIn(ads, ADS.P1)
chan2 = AnalogIn(ads, ADS.P2)
chan3 = AnalogIn(ads, ADS.P3)

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
    # return int(right_min + (valueScaled * right_span))

    # OVERRIDE:
    return int((((20 / math.exp(value)) - 0.3) / 1.18547156429) * 255)

def dataSend():
    HOST = "192.168.2.1"
    PORT = 9000

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect((HOST, PORT)) # connect to server
        x = 0
        y = 0
        while True:
            trim_pot0 = chan0.voltage
            trim_pot1 = chan1.voltage
            trim_pot2 = chan2.voltage
            trim_pot3 = chan3.voltage

            # convert 12bit adc (0-65535) trim pot read into 0-100 volume level
            MAX = 4.1 #* 1.05
            MIN = 1.2 #* 0.95
            BASE = 2.6
            set_value_chan0 = remap_range(trim_pot0, BASE, MAX, 255, 0)
            set_value_chan1 = remap_range(trim_pot1, BASE, MAX, 255, 0)
            set_value_chan2 = remap_range(trim_pot2, BASE, MAX, 255, 0)
            set_value_chan3 = remap_range(trim_pot3, BASE, MAX, 255, 0)

            r = set_value_chan0  # set_value_chan0 # high
            g = set_value_chan1  # set_value_chan1 # mids
            b = set_value_chan2  # set_value_chan2 # lows
            fullOutput = set_value_chan3  # set_value_chan3 (full signal)
            # logger.info(f"{time.time_ns()},{chan0.voltage},{chan1.voltage},{chan2.voltage},{chan3.voltage}")
            logger.info(f"{r},{g},{b},{x},{y}")

            # assign pin inputs to their respective button readings
            pausePlayButton = GPIO.input(pinB)
            clearButton = GPIO.input(pinD)
            animationMode1 = GPIO.input(pinE)
            animationMode2 = GPIO.input(pinC)
            grayscale = GPIO.input(pinA)
            screenshotButton = 1

            if (not animationMode1 and not animationMode2): # in jamming mode, x and y is random
                x = random()
                y = random()

            else: # in spiky or circly gui, x and y is based on an algorithm
                # come up with x and y algorithm
                x = random()
                y = random()
                # x = float(g/510)
                # y = float(math.sqrt((g/510)**2 - x**2))
                # y = float((g+b)/(1020**2))

            someArr = [r, g, b, x, y, pausePlayButton, clearButton, screenshotButton, animationMode1, animationMode2, grayscale, fullOutput]
            bts = msgpack.packb(someArr)
            sock.sendall(bts)
            time.sleep(0.01) # delay in sending data on TCP socket
            print('CH0: ', r)
            print('Voltage: ', trim_pot0)
            print('CH1: ', g)
            print('Voltage: ', trim_pot1)
            print('CH2: ', b)
            print('Voltage: ', trim_pot2)
            print('CH3: ', fullOutput)
            print('Voltage: ', trim_pot3)
            print('\n')
            print('\n\n')

if __name__ == "__main__":
    print("Running...")

    p1 = threading.Thread(target=dataSend, daemon=True)
    p1.start()

    try:
        p1.join()
    except KeyboardInterrupt:
        GPIO.cleanup()
        print("Exiting Python gracefully?")
