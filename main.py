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
cs = digitalio.DigitalInOut(board.D5)

# create the mcp object
mcp = MCP.MCP3008(spi, cs)

# create an analog input channel on pin 0, 1 and 2
chan0 = AnalogIn(mcp, MCP.P0)
chan1 = AnalogIn(mcp, MCP.P1)
chan2 = AnalogIn(mcp, MCP.P2)

# last_read_chan0 = 0       # this keeps track of the last potentiometer value for channel 0
# last_read_chan1 = 0       # this keeps track of the last potentiometer value for channel 1
# last_read_chan2 = 0       # this keeps track of the last potentiometer value for channel 2
# tolerance = 250           # to keep from being jittery we'll only change volume when the pot has moved a significant amount on a 16-bit ADC

def remap_range(value, left_min, left_max, right_min, right_max):
    # this remaps a value from original (left) range to new (right) range
    # Figure out how 'wide' each range is
    left_span = left_max - left_min
    right_span = right_max - right_min

    # Convert the left range into a 0-1 range (int)
    valueScaled = int(value - left_min) / int(left_span)

    # Convert the 0-1 range into a value in the right range.
    return int(right_min + (valueScaled * right_span))


def dataSend():
    HOST = "192.168.2.1"
    PORT = 9000

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect((HOST, PORT)) # connect to server
        r = 0
        g = 0
        b = 0
        x = 0
        y = 0
        while True:
            # # we'll assume that the pot didn't move
            # trim_pot0_changed = False
            # trim_pot1_changed = False
            # trim_pot2_changed = False

            # # read the analog pin
            # trim_pot0 = chan0.value
            # trim_pot1 = chan1.value
            # trim_pot2 = chan2.value

            # # how much has it changed since the last read?
            # pot0_adjust = abs(trim_pot0 - last_read_chan0)
            # pot1_adjust = abs(trim_pot1 - last_read_chan1)
            # pot2_adjust = abs(trim_pot2 - last_read_chan2)

            # if pot0_adjust > tolerance:
            #     trim_pot0_changed = True

            # if trim_pot_changed:
            #     # convert 16bit adc0 (0-65535) trim pot read into 0-100 volume level
            #     set_volume = remap_range(trim_pot, 0, 65535, 0, 100)

            #     # set OS volume playback volume
            #     print('Volume = {volume}%' .format(volume = set_volume))
            #     set_vol_cmd = 'sudo amixer cset numid=1 -- {volume}% > /dev/null' \
            #     .format(volume = set_volume)
            #     os.system(set_vol_cmd)

            #     # save the potentiometer reading for the next loop
            #     last_read = trim_pot


            r = randint(0, 255) # generate a random number in range 0-255 representing rgb value
            g = randint(0, 255)
            b = randint(0, 255)
            x = randint(0, 2000) # generate random number to represent x coordinate of particle
            y = randint(0, 900) # generate random number to represent y coordinate of particle

            # assign pin inputs to their respective button readings
            pausePlayButton = GPIO.input(pin23)
            clearButton = GPIO.input(pin24)
            screenshotButton = GPIO.input(pin25)

            someArr = [r, g, b, x, y, pausePlayButton, clearButton, screenshotButton]
            bts = msgpack.packb(someArr)
            sock.sendall(bts)
            time.sleep(1) # delay in sending data on TCP socket
            print('Raw ADC Value: ', chan0.value)
            print('ADC Voltage: ' + str(chan0.voltage) + 'V')

            print('Raw ADC Value: ', chan1.value)
            print('ADC Voltage: ' + str(chan1.voltage) + 'V')

            print('Raw ADC Value: ', chan1.value)
            print('ADC Voltage: ' + str(chan1.voltage) + 'V')

if __name__ == "__main__":
    print("Running...")

    p1 = threading.Thread(target=dataSend, daemon=True)
    p1.start()

    try:
        p1.join()
    except KeyboardInterrupt:
        GPIO.cleanup()
        print("Exiting Python gracefully?")
