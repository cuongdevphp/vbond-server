const express = require('express');
const header = require('../header');
const common = require('../common');
const moment = require('moment');
const { poolPromise } = require('../db');
const router = express.Router();
const tbl = '[dbo].[TB_LAISUAT]';
const tbl_bond = '[dbo].[TB_TRAIPHIEU]';
const tbl_bond_price = '[dbo].[TB_GIATRITRAIPHIEU]';

/* GET listing. */
router.get('/', header.verifyToken, async (req, res) => {
    //header.setHeader(res);
    header.jwtVerify(req, res);
    try {
        const pool = await poolPromise;
        const sql = `SELECT
                p.*, a.MSTP 
            FROM
                ${tbl} p 
            LEFT JOIN ${tbl_bond} a ON a.BONDID = p.BOND_ID 
            ORDER BY
                p.MSLS DESC;
        `;
        const result = await pool.request().query(sql);
        return res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', header.verifyToken, async (req, res) => {
    header.jwtVerify(req, res);
    try {
        const pool = await poolPromise;

        const MSLS = req.body.MSLS;
        const BOND_ID = req.body.BOND_ID;
        const LS_TOIDA = req.body.LS_TOIDA;
        const LS_TH = req.body.LS_TH;
        const LS_BIENDO = req.body.LS_BIENDO;
        const LS_BINHQUAN = req.body.LS_BINHQUAN;
        const MA_NH01 = req.body.MA_NH01 || 0;
        const MA_NH02 = req.body.MA_NH02 || 0;
        const MA_NH03 = req.body.MA_NH03 || 0;
        const MA_NH04 = req.body.MA_NH04 || 0;
        const MA_NH05 = req.body.MA_NH05 || 0;
        const DIEUKHOAN_LS = req.body.DIEUKHOAN_LS || '';
        const CONGTHUC = req.body.CONGTHUC;
        
        const bondData = await pool.request().query(`
            SELECT MENHGIA, KYHAN, LAISUAT_HH FROM ${tbl_bond} WHERE BONDID = '${BOND_ID}'
        `);
        const bondPrice = await common.recipeBondPrice(
            bondData.recordset[0].LAISUAT_HH, 
            LS_TOIDA, 
            bondData.recordset[0].MENHGIA, 
            bondData.recordset[0].KYHAN, 
            CONGTHUC
        );
        console.log(bondPrice, "bondPrice");
        return res.status(200).json({ bondPrice: bondPrice });
        const queryDulicateMSLS = `SELECT MSLS FROM ${tbl} WHERE MSLS = '${MSLS}'`;
        const rsDup = await pool.request().query(queryDulicateMSLS);
        if(rsDup.recordset.length === 0) {
            const sql = `INSERT INTO ${tbl}
                (MSLS, BOND_ID, LS_TOIDA, LS_TH, LS_BIENDO, LS_BINHQUAN, MA_NH01, MA_NH02, MA_NH03, MA_NH04, MA_NH05, DIEUKHOAN_LS, NGAYTAO, FLAG) VALUES 
                (N'${MSLS}', ${BOND_ID}, ${LS_TOIDA}, ${LS_TH}, ${LS_BIENDO}, ${LS_BINHQUAN}, N'${MA_NH01}', N'${MA_NH02}', N'${MA_NH03}', N'${MA_NH04}', N'${MA_NH05}', N'${DIEUKHOAN_LS}', '${moment().toISOString()}', ${1});`
            try {
                //await pool.request().query(sql);
                try {
                    // await pool.request().query(`
                    // INSERT INTO ${tbl_bond_price}
                    // (BOND_ID, MS_LS, GIATRI_HIENTAI, TRANGTHAI, NGAYTAO, FLAG) VALUES 
                    // (${BOND_ID}, '${MSLS}', ${bondPrice}, ${1}, '${moment().toISOString()}', ${1});
                    // `);
                    res.send('Create data successful!');
                } catch (err) {
                    res.status(500).json({ error: err.message });
                }
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        } else {
            res.status(500).json({ error: 'MSLS bị trùng!'});
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/', header.verifyToken, async (req, res) => {
    header.jwtVerify(req, res);
    try {
        const MSLS = req.body.MSLS;
        const BOND_ID = req.body.BOND_ID;
        const LS_TOIDA = req.body.LS_TOIDA;
        const LS_TH = req.body.LS_TH;
        const LS_BIENDO = req.body.LS_BIENDO;
        const LS_BINHQUAN = req.body.LS_BINHQUAN;
        const MA_NH01 = req.body.MA_NH01;
        const MA_NH02 = req.body.MA_NH02;
        const MA_NH03 = req.body.MA_NH03;
        const MA_NH04 = req.body.MA_NH04;
        const MA_NH05 = req.body.MA_NH05;
        const DIEUKHOAN_LS = req.body.DIEUKHOAN_LS;
        
        const pool = await poolPromise;
        const sql = `UPDATE ${tbl} SET 
                        BOND_ID = ${BOND_ID}, 
                        LS_TOIDA = ${LS_TOIDA}, 
                        LS_TH = ${LS_TH}, 
                        LS_BIENDO = ${LS_BIENDO}, 
                        LS_BINHQUAN = ${LS_BINHQUAN}, 
                        MA_NH01 = N'${MA_NH01}', 
                        MA_NH02 = N'${MA_NH02}', 
                        MA_NH03 = N'${MA_NH03}', 
                        MA_NH04 = N'${MA_NH04}', 
                        MA_NH05 = N'${MA_NH05}', 
                        DIEUKHOAN_LS = N'${DIEUKHOAN_LS}', 
                        NGAYUPDATE = '${moment().toISOString()}' 
                    WHERE MSLS = '${MSLS}'`;
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
        const MSLS = req.body.MSLS;
        const sql = `UPDATE ${tbl} SET FLAG = ${0} WHERE MSLS = '${MSLS}'`;
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