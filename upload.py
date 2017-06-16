import argparse
import os
import re
import requests

from bs4 import BeautifulSoup

try:
    raw_input
except NameError:
    raw_input = input

URL = "https://{team_name}.slack.com/customize/emoji"


def session():
    session = requests.session()
    session.headers = {'Cookie': ''}
    session.url = URL.format(team_name='BotFest2017')
    return session


def _argparse():
    parser = argparse.ArgumentParser(
        description='Bulk upload emoji to slack'
    )
    parser.add_argument(
        '--team-name', '-t',
        default=os.getenv('SLACK_TEAM'),
        help='Defaults to the $SLACK_TEAM environment variable.'
    )
    parser.add_argument(
        '--cookie', '-c',
        default=os.getenv('SLACK_COOKIE'),
        help='Defaults to the $SLACK_COOKIE environment variable.'
    )
    parser.add_argument(
        'slackmoji_files',
        nargs='+',
        help=('Paths to slackmoji, e.g. if you '
              'unzipped http://cultofthepartyparrot.com/parrots.zip '
              'in your home dir, then use ~/parrots/*'),
    )
    args = parser.parse_args()
    if not args.team_name:
        args.team_name = raw_input('Please enter the team name: ').strip()
    if not args.cookie:
        args.cookie = raw_input('Please enter the "emoji" cookie: ').strip()
    return args


def main(emoji_name, filename):
    session = _session()

    upload_emoji(session, emoji_name, filename)
    print("{} upload complete.".format(filename))
    print('\nUploaded {} emojis. ({} already existed)'.format(uploaded, skipped))


def get_current_emoji_list(session):
    r = session.get(session.url)
    r.raise_for_status()
    x = re.findall("data-emoji-name=\"(.*?)\"", r.text)
    return x

def download_file(url):
    local_filename = url.split('/')[-1]
    # NOTE the stream=True parameter
    r = requests.get(url[1:-1], stream=True)
    with open(local_filename, 'wb') as f:
        for chunk in r.iter_content(chunk_size=1024):
            if chunk: # filter out keep-alive new chunks
                f.write(chunk)
                #f.flush() commented by recommendation from J.F.Sebastian
    return local_filename

def upload_emoji(session, emoji_name, filename):
    # Fetch the form first, to generate a crumb.
    r = session.get(session.url)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    crumb = soup.find("input", attrs={"name": "crumb"})["value"]

    data = {
        'add': 1,
        'crumb': crumb,
        'name': emoji_name,
        'mode': 'data',
    }
    files = {'img': open(filename, 'rb')}
    r = session.post(session.url, data=data, files=files, allow_redirects=False)
    r.raise_for_status()
    # Slack returns 200 OK even if upload fails, so check for status of 'alert_error' info box
    if b'alert_error' in r.content:
        soup = BeautifulSoup(r.text, "html.parser")
        crumb = soup.find("p", attrs={"class": "alert_error"})
        print("Error with uploading %s: %s" % (emoji_name, crumb.text))

if __name__ == '__main__':
    main()