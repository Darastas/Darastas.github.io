#!/bin/sh
# FocusFeed Linux Beta installer. Generated from verified release metadata.
# Download the script without sudo; only the package manager needs root.
set -eu

version='0.1.7'
deb_file='FocusFeed_0.1.7_amd64.deb'
deb_sha256='9e57930ed742ba1b2e5f407fa5dfbd1498912053239264dd209b1c80f00a05cb'
rpm_file='FocusFeed-0.1.7-1.x86_64.rpm'
rpm_sha256='6cab2facd57bbe27440aeda7c17378d56acaa36e77892faebcd02872596f43d4'
download_base='https://focusfeed-site.pages.dev/download'

fail() {
    printf 'FocusFeed: %s\n' "$*" >&2
    exit 1
}

require() {
    command -v "$1" >/dev/null 2>&1 || fail "Missing command: $1. Install it with your distribution's package manager and retry."
}

as_root() {
    if [ "$(id -u)" = 0 ]; then
        "$@"
    else
        sudo "$@"
    fi
}

main() {
    [ "$(uname -s)" = Linux ] || fail 'This installer requires Linux.'
    case "$(uname -m)" in
        x86_64|amd64) ;;
        *) fail 'This Beta currently supports x86_64 only; ARM packages are not available.' ;;
    esac
    for cmd in curl sha256sum mktemp rm id; do require "$cmd"; done
    if command -v apt-get >/dev/null 2>&1; then
        manager=apt
        file=$deb_file
        expected=$deb_sha256
    elif command -v dnf >/dev/null 2>&1; then
        require rpm
        require sort
        require tail
        manager=dnf
        file=$rpm_file
        expected=$rpm_sha256
    else
        fail 'Automatic installation supports apt (Mint/Ubuntu/Debian) or dnf (Fedora). Use the DEB/RPM downloads for other package managers.'
    fi
    if [ "$(id -u)" != 0 ]; then require sudo; fi

    work_dir=$(mktemp -d "${TMPDIR:-/tmp}/focusfeed-install.XXXXXXXX")
    trap 'rm -rf "$work_dir"' 0
    trap 'exit 1' HUP INT TERM
    # Package managers require an absolute path to recognize a local package.
    work_dir=$(cd "$work_dir" && pwd -P)
    package="$work_dir/$file"
    printf 'Downloading FocusFeed %s Linux Beta (%s)...\n' "$version" "$manager"
    curl --fail --show-error --location --retry 2 --connect-timeout 20 \
        --proto '=https' --proto-redir '=https' "$download_base/$file?rev=$expected" -o "$package" \
        || fail 'Download failed. Check your connection and retry.'
    printf '%s  %s\n' "$expected" "$package" | sha256sum --check --status \
        || fail 'SHA-256 verification failed. Installation was cancelled.'

    printf 'Verified SHA-256. Installing %s; please close any running FocusFeed window.\n' "$version"
    if [ "$manager" = apt ]; then
        as_root apt-get install --yes --allow-downgrades --reinstall "$package" \
            || fail 'apt installation failed. Check the package-manager output, repositories and WebKitGTK 4.1 availability.'
    else
        action=install
        target="0:$version-1"
        if installed=$(rpm -q --qf '%{EPOCHNUM}:%{VERSION}-%{RELEASE}\n' focus-feed 2>/dev/null); then
            if [ "$installed" = "$target" ]; then
                action=reinstall
            elif [ "$(printf '%s\n%s\n' "$installed" "$target" | sort -V | tail -n 1)" = "$installed" ]; then
                action=downgrade
            fi
        fi
        as_root dnf "$action" --assumeyes "$package" \
            || fail 'dnf installation failed. Check the package-manager output, repositories and WebKitGTK 4.1 availability.'
    fi
    printf 'FocusFeed %s Linux Beta installed. Launch FocusFeed from your desktop menu or run rss-cross-app as your desktop user.\n' "$version"
}

# Keep invocation last so an incomplete piped download cannot begin installing.
main "$@"
