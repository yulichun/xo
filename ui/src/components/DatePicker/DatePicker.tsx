import { Box, HStack, Modal, ModalBody, ModalContent, ModalOverlay, Text, Tooltip, useDisclosure } from "@chakra-ui/react"
import TimePicker, { TimePickerKey, getInitTimeRange, initTimeRange } from "./TimePicker"
import { TimeRange } from "types/time"
import { FaRegClock } from "react-icons/fa"
import IconButton from "../button/IconButton"
import { useState } from "react"
import useBus, { dispatch } from "use-bus"
import { TimeChangedEvent, TimeRefreshEvent } from "src/data/bus-events"
import { subMinutes } from "date-fns"
import storage from "utils/localStorage"

interface Props {
    showTime?: boolean
}
const DatePicker = ({ showTime = false }: Props) => {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [value, setValue] = useState<TimeRange>(getInitTimeRange())

    const onTimeChange = (t: TimeRange) => {
        console.log("here time", t)
        setValue(t)
        onClose()
        dispatch({ type: TimeChangedEvent, data: t })
    }

    useBus(
        TimeRefreshEvent, 
        () => {
            console.log("here3333 time aaa")
            refresh()
        },
        []
    )
    const refresh = () => {
        const tr = getInitTimeRange()
        if (tr.sub > 0) {
            const now = new Date()
            tr.start = subMinutes(now, tr.sub)
            tr.end = now
            storage.set(TimePickerKey, JSON.stringify(tr))
            dispatch({type:  TimeChangedEvent,data: tr})
            setValue(tr)
        }
    }

    return (
        <>
            <Box>
                <Tooltip label={`${value?.start.toLocaleString()} - ${value?.end.toLocaleString()}`}>
                    <HStack spacing={0} onClick={onOpen} cursor="pointer">
                        <IconButton variant="ghost">
                            <FaRegClock />
                        </IconButton>
                        {
                            showTime && <Text layerStyle="textSecondary" fontSize="1rem">{value.startRaw} to {value.endRaw}</Text>
                        }
                    </HStack>
                </Tooltip>
            </Box>
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent minW="fit-content">
                    <ModalBody>
                        <TimePicker onClose={onClose} onTimeChange={onTimeChange} />
                    </ModalBody>

                </ModalContent>
            </Modal>
        </>
    )
}

export default DatePicker