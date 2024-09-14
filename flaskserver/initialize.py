from switch_mode.class_definition import showTechClass
from switch_mode.command_modules import *

def initialize(file):
   showtech = showTechClass.ShowTech(file)
   showtech.show_tech_commands_modifier()
   showtech.get_hostname()
   showtech.gather_commands()
   showtech.routing_logic()
   return showtech