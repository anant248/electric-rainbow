from tkinter import Label
import RPi.GPIO as GPIO
import time

import gui as gui
#from sensor import distance
from check_frequency import checkFrequency


# GPIO Mode (BOARD / BCM)
GPIO.setmode(GPIO.BCM)
"""
# set GPIO Pins
GPIO_TRIGGER = 18
GPIO_ECHO = 24

# set GPIO direction (IN / OUT)
GPIO.setup(GPIO_TRIGGER, GPIO.OUT)
GPIO.setup(GPIO_ECHO, GPIO.IN)
"""

# set GPIO Pins
GPIO_HIGH = 18
GPIO_LOW = 24

# set GPIO direction (IN / OUT)
GPIO.setup(GPIO_HIGH, GPIO.IN)
GPIO.setup(GPIO_LOW, GPIO.IN)

if __name__ == '__main__':
	Animation_Window = gui.create_animation_window()
	Animation_canvas = gui.create_animation_canvas(Animation_Window)
	global label
	label = Label(Animation_Window, text="Frequency: ", font=('Aerial 18'))
	label.pack()

	
	try:
		while True:
			Animation_Window.update_idletasks()
			Animation_Window.update()

			frequency = checkFrequency(GPIO_HIGH, GPIO_LOW)

			"""
			r_value = 0
			g_value = 0
			b_value = 0
			
			
			#dist = distance()
			
			#label["text"] = dist
			
			if dist < 5:
				#r_value = 255
				hex_value = "Red"
			else:
				#g_value = 255
				hex_value = 'Green'
			"""

			if frequency == "HIGH":
				hex_value = "Red"
			else:
				hex_value = 'Green'

			label["text"] = "Frequency: " + frequency

			
			#hex_value = '#%02x%02x%02x' % (r_value, g_value, b_value)
			Animation_canvas.config(bg=hex_value)
			#print("Measured Distance = %.1f cm" % dist)
			
			#time.sleep(1)# Reset by pressing CTRL + C	
	except KeyboardInterrupt:
		print("Measurement stopped by User")
		GPIO.cleanup()
