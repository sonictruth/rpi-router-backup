sudo cp dualhostapd.service /etc/systemd/system
sudo systemctl stop hostapd.service
sudo systemctl disable hostapd.service
sudo systemctl enable dualhostapd.service
sudo systemctl start dualhostapd.service

