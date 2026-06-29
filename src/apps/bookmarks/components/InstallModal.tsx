import { Modal, Tabs, Stack, Text, Code, Button, Group, Anchor, CopyButton, Tooltip, List, ThemeIcon } from '@mantine/core'
import { Icon } from '@iconify/react'
import { APP_CONFIG } from '@/config/app'

interface InstallModalProps {
  opened: boolean
  onClose: () => void
}

export default function InstallModal({ opened, onClose }: InstallModalProps) {
  const baseUrl = window.location.origin + APP_CONFIG.basePath
  const bookmarkletCode = `javascript:(()=>{const u=encodeURIComponent(location.href);const t=encodeURIComponent(document.title);const d=encodeURIComponent(window.getSelection()?.toString()||'');open('${baseUrl}bookmarks?action=add&url='+u+'&title='+t+(d?'&description='+d:''))})()`

  return (
    <Modal opened={opened} onClose={onClose} title="Setup quick saving" size="lg">
      <Tabs defaultValue="bookmarklet">
        <Tabs.List mb="md">
          <Tabs.Tab value="bookmarklet" leftSection={<Icon icon="lucide:mouse-pointer-click" width={14} />}>
            Bookmarklet
          </Tabs.Tab>
          <Tabs.Tab value="extension" leftSection={<Icon icon="lucide:puzzle" width={14} />}>
            Browser Extension
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="bookmarklet">
          <Stack gap="md">
            <Text size="sm">
              Drag the button below to your browser's bookmarks bar. Then click it on any page to save it instantly.
            </Text>

            <Group justify="center" py="md">
              <Anchor
                href={bookmarkletCode}
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: 'var(--mantine-color-amber-6)',
                  color: '#000',
                  borderRadius: 'var(--mantine-radius-md)',
                  fontWeight: 600,
                  fontSize: '16px',
                  cursor: 'grab',
                  textDecoration: 'none',
                  userSelect: 'none',
                }}
              >
                Save to StartDeck
              </Anchor>
            </Group>

            <Text size="xs" c="dimmed" ta="center">
              Or copy the code below and add it manually
            </Text>

            <Group gap="xs" wrap="nowrap" align="flex-start">
              <Code block style={{ flex: 1, wordBreak: 'break-all', whiteSpace: 'pre-wrap', maxHeight: 100, overflow: 'auto', fontSize: '11px' }}>
                {bookmarkletCode}
              </Code>
              <CopyButton value={bookmarkletCode}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied' : 'Copy code'}>
                    <Button size="compact-sm" variant="light" onClick={copy} style={{ flexShrink: 0 }}>
                      <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} width={14} />
                    </Button>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>

            <Text size="xs" c="dimmed">
              After adding, click "Save to StartDeck" on any page. Selected text becomes the description.
            </Text>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="extension">
          <Stack gap="md">
            <Text size="sm">
              The browser extension adds a toolbar button and right-click menu to save pages.
            </Text>

            <Text size="sm" fw={600}>Installation</Text>

            <List spacing="xs" size="sm">
              <List.Item
                icon={
                  <ThemeIcon size={20} radius="xl" color="orange">
                    <Icon icon="lucide:flame" width={12} />
                  </ThemeIcon>
                }
              >
                <Text size="sm" fw={600}>Firefox</Text>
                <Text size="xs" c="dimmed">Go to <Code>about:debugging#/runtime/this-firefox</Code> → "Load Temporary Add-on" → select <Code>extensions/bookmarks/manifest.json</Code></Text>
              </List.Item>

              <List.Item
                icon={
                  <ThemeIcon size={20} radius="xl" color="green">
                    <Icon icon="lucide:chrome" width={12} />
                  </ThemeIcon>
                }
              >
                <Text size="sm" fw={600}>Chrome / Edge</Text>
                <Text size="xs" c="dimmed">Go to <Code>chrome://extensions</Code> → enable "Developer mode" → "Load unpacked" → select the <Code>extensions/bookmarks</Code> folder</Text>
              </List.Item>
            </List>

            <Text size="sm" fw={600}>First use</Text>
            <Text size="xs" c="dimmed">
              Click the extension icon in your browser toolbar, click <b>Configure app URL</b> at the bottom,
              and set it to:
            </Text>
            <Code block style={{ fontSize: '12px' }}>{baseUrl}</Code>

            <Text size="sm" fw={600}>Usage</Text>
            <List size="sm" spacing={4}>
              <List.Item>Click the extension icon on any page → tags → "Save to StartDeck"</List.Item>
              <List.Item>Right-click any page or link → "Save to StartDeck"</List.Item>
            </List>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
}
