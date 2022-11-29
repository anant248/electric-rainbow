# Libraries
import RPi.GPIO as GPIO
import time


def checkFrequency(GPIO_HIGH, GPIO_LOW):
    frequency = ""

    if GPIO.input(GPIO_HIGH) == 1:
        frequency = "HIGH"
    elif GPIO.input(GPIO_LOW) == 1:
        frequency = "LOW"

    return frequency
