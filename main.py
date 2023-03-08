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
import adafruit_mcp3xxx.mcp3008 as MCP
from adafruit_mcp3xxx.analog_in import AnalogIn
from statistics import mean, median

# Logging in order to send voltage debugging info into a file - in order to visualize remap range
import logging
logger = logging.Logger("voltages", logging.DEBUG)
# fmt = logging.Formatter(format='%(asctime)s %(message)s')
logger.addHandler(logging.FileHandler(os.path.join(os.getcwd(), "volategs.log"), mode='w+'))

# GPIO Mode (BOARD / BCM)
GPIO.setmode(GPIO.BCM)

# set GPIO Pins
pin23 = 23 # GPIO23 on the Pi
pin24 = 24 # GPIO24 on the Pi
pin25 = 25 # GPIO25 on the Pi

# set GPIO direction (IN / OUT)
GPIO.setup(pin23, GPIO.IN)
GPIO.setup(pin24, GPIO.IN)
GPIO.setup(pin25, GPIO.IN)

# create the spi bus
spi = busio.SPI(clock=board.SCK, MISO=board.MISO, MOSI=board.MOSI)

# create the cs (chip select)
cs = digitalio.DigitalInOut(board.D22)

# create the mcp object
mcp = MCP.MCP3008(spi, cs)

# create an analog input channel on pin 0, 1 and 2
chan0 = AnalogIn(mcp, MCP.P0)
chan1 = AnalogIn(mcp, MCP.P1)
chan2 = AnalogIn(mcp, MCP.P2)

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
    HOST = "192.168.2.1"
    PORT = 9000

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect((HOST, PORT)) # connect to server
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
            
            trim_pot0 = chan0.voltage
            trim_pot1 = chan1.voltage
            trim_pot2 = chan2.voltage

            # convert 16bit adc0 (0-65535) trim pot read into 0-100 volume level
            set_value_chan0 = remap_range(trim_pot0, 2.10, 2.80, 255, 0)
            set_value_chan1 = remap_range(trim_pot1, 2.10, 2.50, 255, 0)
            set_value_chan2 = remap_range(trim_pot2, 2.10, 3.00, 255, 0)

            r = set_value_chan0  # set_value_chan0
            g = set_value_chan1  # set_value_chan1
            b = set_value_chan2  # set_value_chan2
            logger.info(f"{time.time_ns()},{chan0.voltage},{chan1.voltage},{chan2.voltage}")

            # discard and dont send rgb values that are 255, 255, 255 (white)
            if r >= 250 and g >= 250 and b >= 250:
                continue

            x = randint(0, 2000) # generate random number to represent x coordinate of particle  r/255 * 1500 + randint(0,100)/20
            y = randint(0, 900) # generate random number to represent y coordinate of particle

            # assign pin inputs to their respective button readings
            pausePlayButton = GPIO.input(pin23)
            clearButton = GPIO.input(pin24)
            screenshotButton = GPIO.input(pin25)

            someArr = [r, g, b, x, y, pausePlayButton, clearButton, screenshotButton]
            bts = msgpack.packb(someArr)
            sock.sendall(bts)
            time.sleep(0.03) # delay in sending data on TCP socket
            print('CH0: ', r)
            print('Voltage: ', trim_pot0)
            print('CH1: ', g)
            print('Voltage: ', trim_pot1)
            print('CH2: ', b)
            print('Voltage: ', trim_pot2)
            print('\n')

if __name__ == "__main__":
    print("Running...")

    p1 = threading.Thread(target=dataSend, daemon=True)
    p1.start()

    try:
        p1.join()
    except KeyboardInterrupt:
        GPIO.cleanup()
        print("Exiting Python gracefully?")
