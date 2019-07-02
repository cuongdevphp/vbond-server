const express = require('express');
const header = require('../header');
const common = require('../common');
const moment = require('moment');
const { poolPromise } = require('../db');
const router = express.Router();
const tbl = '[dbo].[TB_DATLENH]';
const tbl_bond = '[dbo].[TB_TRAIPHIEU]';
const tbl_investors = '[dbo].[TB_NHADAUTU]';
const tbl_assets = '[dbo].[TB_TAISAN]';
const tbl_NTL = '[dbo].[TB_NGAYTINHLAITRONGNAM]';

/* GET listing. */
router.get('/:status', header.verifyToken, async (req, res) => {
    header.jwtVerify(req, res);
    const status = req.params.status || '';
    try {
        const pool = await poolPromise;
        const sql = `SELECT 
                    p.*,
                    a.MSTP,
                    b.TENNDT
                FROM
                    ${tbl} p
                LEFT JOIN ${tbl_bond} a ON a.BONDID = p.BOND_ID
                LEFT JOIN ${tbl_investors} b ON b.MSNDT = p.MS_NDT 
                ${(status) ? `WHERE TRANGTHAI_LENH = ${status}` : ''} 
                ORDER BY
                    p.MSDL DESC;
            ;`;
        const result = await pool.request().query(sql);
        result.recordset.forEach((v) => {
            v.NGAY_TRAITUC = JSON.parse(v.NGAY_TRAITUC)
        });
        return res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/updateStatus', header.verifyToken, async (req, res) => {
    header.jwtVerify(req, res);
    try {
        const MSDL = req.body.MSDL;
        const status = req.body.status;

        const pool = await poolPromise;
        const sql = `UPDATE ${tbl} SET 
                        TRANGTHAI_LENH = ${status}
                    WHERE MSDL = ${MSDL}`;
        try {
            await pool.request().query(sql);
            const fetchCommand = await pool.request().query(`
                SELECT p.MS_NDT, p.BOND_ID, p.NGAY_GD, p.SOLUONG, p.DONGIA, 
                    a.LAISUAT_HH, a.NGAYPH, a.NGAYDH,
                    b.SONGAYTINHLAI
                FROM ${tbl} p 
                LEFT JOIN ${tbl_bond} a ON a.BONDID = p.BOND_ID
                LEFT JOIN ${tbl_NTL} B ON a.MS_NTLTN = b.MSNTLTN
                WHERE MSDL = ${MSDL}`
            );
            console.log(fetchCommand);
            const day = common.genTotalDateHolding(
                fetchCommand[0].NGAY_GD, 
                fetchCommand[0].NGAYPH,
                fetchCommand[0].NGAYDH,
                fetchCommand[0].SONGAYTINHLAI
            );
            console.log(day);
            await pool.request().query(`
                INSERT INTO ${tbl_assets} 
                (MS_NDT, MS_DL, BOND_ID, MS_LENHMUA, LAISUATKHIMUA, 
                SONGAYNAMGIU, NGAYMUA, SOLUONG, DONGIA, TONGGIATRI, SL_KHADUNG, SL_DABAN, GIATRIKHIBAN, 
                LAISUATKHIBAN, TRANGTHAI, CAPGIAY_CN, NGAYTAO, FLAG) VALUES 
                (N'${fetchCommand[0].MS_NDT}', N'${fetchCommand[0].MS_DL}', ${fetchCommand[0].BOND_ID}, 
                N'${fetchCommand[0].MS_LENHMUA}', ${fetchCommand[0].LAISUAT_HH}, 
                ${day}, '${moment().toISOString()}', ${fetchCommand[0].SOLUONG}, ${fetchCommand[0].DONGIA}, 
                ${TONGGIATRI}, ${fetchCommand[0].SOLUONG}, ${0}, ${0}, 
                ${0}, ${1}, ${1}, '${moment().toISOString()}', ${1});
            `);
            res.status(200).json({ message: 'Duyệt lệnh thành công' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', header.verifyToken, async (req, res) => {
    header.jwtVerify(req, res);
    try {
        const BOND_ID = req.body.BOND_ID;
        const MS_NDT = req.body.MS_NDT;
        const MS_ROOM = req.body.MS_ROOM;
        const MS_NGUOI_GT = req.body.MS_NGUOI_GT;
        const SOLUONG = req.body.SOLUONG;
        const DONGIA = req.body.DONGIA;
        const TONGGIATRI = req.body.TONGGIATRI;
        const LAISUAT_DH = req.body.LAISUAT_DH;
        const NGAY_GD = req.body.NGAY_GD;
        const GHICHU = req.body.GHICHU || '';
        const NGAY_TRAITUC = req.body.NGAY_TRAITUC;

        const pool = await poolPromise;
        const sql = `INSERT INTO ${tbl}
        (BOND_ID, MS_NDT, MS_ROOM,
        MS_NGUOI_GT, SOLUONG, DONGIA, TONGGIATRI, LAISUAT_DH, NGAY_GD, 
        TRANGTHAI_LENH, NGAY_TRAITUC, GHICHU, NGAYTAO, FLAG) VALUES 
        (${BOND_ID}, N'${MS_NDT}', N'${MS_ROOM}', N'${MS_NGUOI_GT}', ${SOLUONG}, ${DONGIA}, ${TONGGIATRI}, ${LAISUAT_DH}, 
        '${moment(NGAY_GD).toISOString()}', '${0}', '${NGAY_TRAITUC}', N'${GHICHU}',
        '${moment().toISOString()}', ${1});`
        try {
            await pool.request().query(sql);
            res.send('Create data successful!');
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/', header.verifyToken, async (req, res) => {
    header.jwtVerify(req, res);
    try {
        const MSDL = req.body.MSDL;
        const BOND_ID = req.body.BOND_ID;
        const MS_TP = req.body.MS_TP;
        const MS_NDT = req.body.MS_NDT;
        const MS_ROOM = req.body.MS_ROOM;
        const MS_TRANGTHAI = req.body.MS_TRANGTHAI;
        const MS_LENH = req.body.MS_LENH;
        const TENLOAI_TP = req.body.TENLOAI_TP;
        const MS_NGUOI_GT = req.body.MS_NGUOI_GT;
        const SOLUONG = req.body.SOLUONG;
        const DONGIA = req.body.DONGIA;
        const TONGGIATRI = req.body.TONGGIATRI;
        const LAISUAT_DH = req.body.LAISUAT_DH;
        const NGAY_GD = req.body.NGAY_GD;
        const NGAY_DH = req.body.NGAY_DH;
        const TRANGTHAICHO = req.body.TRANGTHAICHO;
        const GHICHU = req.body.GHICHU;
        const pool = await poolPromise;
        const sql = `UPDATE ${tbl} SET 
                        BOND_ID = ${BOND_ID}, 
                        MS_TP = N'${MS_TP}', 
                        MS_NDT = N'${MS_NDT}', 
                        MS_ROOM = N'${MS_ROOM}', 
                        MS_TRANGTHAI = ${MS_TRANGTHAI}, 
                        MS_LENH = ${MS_LENH}, 
                        TENLOAI_TP = N'${TENLOAI_TP}', 
                        MS_NGUOI_GT = N'${MS_NGUOI_GT}', 
                        SOLUONG = ${SOLUONG}, 
                        DONGIA = ${DONGIA}, 
                        TONGGIATRI = ${TONGGIATRI}, 
                        LAISUAT_DH = ${LAISUAT_DH}, 
                        NGAY_GD = '${moment(NGAY_GD).toISOString()}',
                        NGAY_DH = '${moment(NGAY_DH).toISOString()}',
                        GHICHU = N'${GHICHU}', 
                        TRANGTHAICHO = N'${TRANGTHAICHO}', 
                        NGAYUPDATE = '${moment().toISOString()}' 
                    WHERE MSDL = ${MSDL}`;
        try {
            await pool.request().query(sql);
            res.send('Update data successfully');
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/', header.verifyToken, async (req, res) => {
    header.jwtVerify(req, res);
    try {
        const MSDL = req.body.MSDL;
        const sql = `UPDATE ${tbl} SET FLAG = ${0} WHERE MSDL = ${MSDL}`;
        const pool = await poolPromise;
        try {
            await pool.request().query(sql);
            res.send('Delete data successfully');
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;